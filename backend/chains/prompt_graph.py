from typing import TypedDict
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END
from config import get_model


class PromptState(TypedDict):
    function_name: str
    original_nodes: list
    original_edges: list
    edited_nodes: list
    edited_edges: list
    prompt: str


def generate_node(state: PromptState) -> PromptState:
    orig_node_map = {n["id"]: n for n in state["original_nodes"]}
    edit_node_map = {n["id"]: n for n in state["edited_nodes"]}

    orig_ids = set(orig_node_map)
    edit_ids = set(edit_node_map)

    removed_nodes = [orig_node_map[nid] for nid in orig_ids - edit_ids if orig_node_map[nid]["type"] not in ("start",)]
    added_nodes = [edit_node_map[nid] for nid in edit_ids - orig_ids]

    orig_edge_ids = {e["id"] for e in state["original_edges"]}
    edit_edge_ids = {e["id"] for e in state["edited_edges"]}
    removed_edges = [e for e in state["original_edges"] if e["id"] not in edit_edge_ids]
    added_edges = [e for e in state["edited_edges"] if e["id"] not in orig_edge_ids]

    if not any([removed_nodes, added_nodes, removed_edges, added_edges]):
        return {**state, "prompt": "No changes detected — the flowchart matches the original code."}

    line_starts = [n.get("line_start", 0) for n in state["original_nodes"] if n.get("line_start")]
    line_ends = [n.get("line_end", 0) for n in state["original_nodes"] if n.get("line_end")]
    line_range = f"lines {min(line_starts)}–{max(line_ends)}" if line_starts else "unknown lines"

    original_steps = "\n".join(
        f"  - {n['label']}  [{n['raw_code']}]"
        for n in state["original_nodes"]
        if n["type"] not in ("start",) and n.get("raw_code")
    )

    changes: list[str] = []
    for n in removed_nodes:
        changes.append(f"- Remove the step that {n['label'].lower()}. Original code: `{n['raw_code']}`")
    for n in added_nodes:
        changes.append(f"- Add a new step: '{n['label']}'")
    for e in removed_edges:
        src_label = orig_node_map.get(e["source"], {}).get("label", e["source"])
        tgt_label = orig_node_map.get(e["target"], {}).get("label", e["target"])
        changes.append(f"- Disconnect '{src_label}' from '{tgt_label}'")
    for e in added_edges:
        all_nodes = {**orig_node_map, **edit_node_map}
        src_label = all_nodes.get(e["source"], {}).get("label", e["source"])
        tgt_label = all_nodes.get(e["target"], {}).get("label", e["target"])
        changes.append(f"- Connect '{src_label}' to '{tgt_label}'")

    msg = f"""You are helping a non-developer communicate a code change to an AI coding agent.

Function: `{state["function_name"]}` ({line_range})

Current steps in the code:
{original_steps}

Changes the user made to the flowchart:
{chr(10).join(changes)}

Write a clear, paste-ready prompt the user can give to their AI coding agent. The prompt must:
- Name the function and its line range
- Quote the exact original code for any removed or changed step
- Describe each change in plain English
- End with: "Make only these changes. Do not modify any other functions."

Output the prompt text only — no preamble, no explanation."""

    model = get_model()
    response = model.invoke([HumanMessage(content=msg)])
    return {**state, "prompt": response.content}


def build_graph():
    g = StateGraph(PromptState)
    g.add_node("generate", generate_node)
    g.set_entry_point("generate")
    g.add_edge("generate", END)
    return g.compile()


_graph = build_graph()


def generate_prompt(
    function_name: str,
    original_nodes: list,
    original_edges: list,
    edited_nodes: list,
    edited_edges: list,
) -> str:
    result = _graph.invoke({
        "function_name": function_name,
        "original_nodes": original_nodes,
        "original_edges": original_edges,
        "edited_nodes": edited_nodes,
        "edited_edges": edited_edges,
        "prompt": "",
    })
    return result["prompt"]
