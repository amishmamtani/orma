import ast
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ParseRequest(BaseModel):
    code: str


def build_node_tree(code: str) -> list:
    lines = code.splitlines()
    tree = ast.parse(code)
    nodes = []

    for i, node in enumerate(ast.iter_child_nodes(tree)):
        if not hasattr(node, "lineno"):
            continue

        line_start = node.lineno
        line_end = getattr(node, "end_lineno", node.lineno)
        raw_code = "\n".join(lines[line_start - 1 : line_end])

        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            label = node.name
        elif isinstance(node, ast.ClassDef):
            label = node.name
        else:
            label = type(node).__name__

        nodes.append({
            "id": f"node_{i}",
            "label": label,
            "raw_code": raw_code,
            "line_start": line_start,
            "line_end": line_end,
            "children": [],
        })

    return nodes


@app.get("/")
def root():
    return {"status": "ok", "service": "orma"}


@app.post("/parse")
def parse_code(request: ParseRequest):
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="No code provided.")
    try:
        nodes = build_node_tree(request.code)
    except SyntaxError as e:
        raise HTTPException(status_code=422, detail=f"Invalid Python: {e.msg} (line {e.lineno})")
    return {"nodes": nodes}