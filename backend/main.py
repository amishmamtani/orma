import ast
import sys
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.dirname(__file__))
from chains.labeling_graph import label_function
from chains.prompt_graph import generate_prompt

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ParseRequest(BaseModel):
    code: str


def find_user_func_calls(stmt, user_func_names: set) -> set:
    called = set()
    for node in ast.walk(stmt):
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            if node.func.id in user_func_names:
                called.add(node.func.id)
    return called


def build_function_graph(func_node, code: str, func_id: str,
                         user_func_names: set = None, func_source_map: dict = None):
    user_func_names = user_func_names or set()
    func_source_map = func_source_map or {}
    lines = code.splitlines()
    nodes = []
    edges = []
    node_counter = [0]
    edge_counter = [0]

    def next_nid():
        nid = f"{func_id}_n{node_counter[0]}"
        node_counter[0] += 1
        return nid

    def add_edge(source, target, label=""):
        eid = f"{func_id}_e{edge_counter[0]}"
        edge_counter[0] += 1
        edges.append({"id": eid, "source": source, "target": target, "label": label})

    start_id = next_nid()
    nodes.append({
        "id": start_id,
        "type": "start",
        "label": "Start",
        "raw_code": "",
        "line_start": func_node.lineno,
        "line_end": func_node.lineno,
    })

    pending = [(start_id, "")]

    def walk(stmts, depth=0):
        nonlocal pending
        for stmt in stmts:
            nid = next_nid()
            line_s = stmt.lineno
            line_e = getattr(stmt, "end_lineno", stmt.lineno)
            header = lines[line_s - 1].strip() if line_s <= len(lines) else ""

            if isinstance(stmt, ast.Return):
                raw = ast.get_source_segment(code, stmt) or header
                nodes.append({"id": nid, "type": "end", "label": "", "raw_code": raw,
                               "line_start": line_s, "line_end": line_e})
                for src, lbl in pending:
                    add_edge(src, nid, lbl)
                pending = [(nid, "")]

            elif isinstance(stmt, (ast.For, ast.While)) and depth < 2:
                nodes.append({"id": nid, "type": "loop", "label": "", "raw_code": header,
                               "line_start": line_s, "line_end": line_e})
                for src, lbl in pending:
                    add_edge(src, nid, lbl)
                pending = [(nid, "")]
                walk(stmt.body, depth + 1)

            elif isinstance(stmt, ast.If) and depth < 2:
                nodes.append({"id": nid, "type": "condition", "label": "", "raw_code": header,
                               "line_start": line_s, "line_end": line_e})
                for src, lbl in pending:
                    add_edge(src, nid, lbl)

                merge_pending = []

                pending = [(nid, "Yes")]
                walk(stmt.body, depth + 1)
                merge_pending.extend(pending)

                if stmt.orelse:
                    pending = [(nid, "No")]
                    walk(stmt.orelse, depth + 1)
                    merge_pending.extend(pending)
                else:
                    merge_pending.append((nid, "No"))

                pending = merge_pending

            else:
                raw = ast.get_source_segment(code, stmt) or header
                called = find_user_func_calls(stmt, user_func_names - {func_node.name})
                if called:
                    called_name = next(iter(called))
                    nodes.append({
                        "id": nid, "type": "function_call", "label": "",
                        "raw_code": raw, "called_function": called_name,
                        "called_function_code": func_source_map.get(called_name, ""),
                        "call_description": "", "call_output": "",
                        "line_start": line_s, "line_end": line_e,
                    })
                else:
                    nodes.append({"id": nid, "type": "action", "label": "", "raw_code": raw,
                                   "line_start": line_s, "line_end": line_e})
                for src, lbl in pending:
                    add_edge(src, nid, lbl)
                pending = [(nid, "")]

    walk(func_node.body)
    return nodes, edges


def build_all_functions(code: str) -> list:
    tree = ast.parse(code)

    user_func_names = set()
    func_source_map = {}
    for node in ast.iter_child_nodes(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            user_func_names.add(node.name)
            func_source_map[node.name] = ast.get_source_segment(code, node) or ""

    functions = []
    for func_idx, node in enumerate(ast.iter_child_nodes(tree)):
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue

        func_id = f"func_{func_idx}"
        nodes, edges = build_function_graph(node, code, func_id, user_func_names, func_source_map)

        label_map = label_function(node.name, nodes)
        for n in nodes:
            if n["type"] == "start":
                continue
            lbl = label_map.get(n["id"])
            if lbl:
                n["label"] = lbl.get("label", n["raw_code"])
                if n["type"] == "function_call":
                    n["call_description"] = lbl.get("call_description", "")
                    n["call_output"] = lbl.get("call_output", "")
            else:
                n["label"] = n["raw_code"]
            n.pop("called_function_code", None)

        functions.append({
            "id": func_id,
            "name": node.name,
            "nodes": nodes,
            "edges": edges,
        })

    return functions


class GeneratePromptRequest(BaseModel):
    function_name: str
    original_nodes: list
    original_edges: list
    edited_nodes: list
    edited_edges: list


@app.post("/generate-prompt")
def generate_prompt_endpoint(request: GeneratePromptRequest):
    prompt = generate_prompt(
        request.function_name,
        request.original_nodes,
        request.original_edges,
        request.edited_nodes,
        request.edited_edges,
    )
    return {"prompt": prompt}


@app.get("/")
def root():
    return {"status": "ok", "service": "orma"}


@app.post("/parse")
def parse_code(request: ParseRequest):
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="No code provided.")
    try:
        functions = build_all_functions(request.code)
    except SyntaxError as e:
        raise HTTPException(status_code=422, detail=f"Invalid Python: {e.msg} (line {e.lineno})")
    return {"functions": functions}
