from typing import TypedDict
from langgraph.graph import StateGraph, END
from pydantic import BaseModel
from config import get_model

LABELING_PROMPT = """You are labeling steps in a software application for a non-technical user who has never seen code.

Given the following code steps from the function `{function_name}`, write a plain-English label for each step.

Rules for all steps:
- Use product language, not developer terms (avoid: function, method, loop, iterate, variable, return, instantiate, import)
- Active voice: "Filter active orders" not "Active order filtering"
- Be specific to what THIS step does
- For condition steps, phrase as a natural yes/no question — PRESERVE the logical direction exactly. If the code uses `if not user:` or `if user is None:`, ask "Is the user missing?" not "Is the user found?" — because "Yes" maps to the body (condition was true).
- For loop steps, describe what is being processed: "For each order in the list"
- For end/output steps:
  1. Early exits (returning None, False, empty, or error mid-function): "Stops here — [reason]"
  2. Normal completion (final return): "Done — outputs [what the return expression literally is]"

Rules for steps marked [CALLS → function_name]:
- These steps call another function defined in the same codebase. The called function's source code is shown below the node id.
- label: under 10 words describing what this step does by calling that function
- call_description: one plain-English sentence (under 15 words) describing what the called function does — no code terms
- call_output: one sentence (under 12 words) saying what it returns and what the calling function does with the result
- For all other steps: leave call_description and call_output as null

Steps to label:
{steps}

Return a label for every node_id listed. For [CALLS →] steps also return call_description and call_output."""


class NodeLabel(BaseModel):
    node_id: str
    label: str
    call_description: str | None = None
    call_output: str | None = None


class FunctionLabels(BaseModel):
    labels: list[NodeLabel]


class LabelState(TypedDict):
    function_name: str
    nodes: list[dict]
    labels: list[dict]


def label_nodes(state: LabelState) -> LabelState:
    nodes_to_label = [n for n in state["nodes"] if n["type"] != "start"]
    if not nodes_to_label:
        return {**state, "labels": []}

    model = get_model().with_structured_output(FunctionLabels)

    parts = []
    for n in nodes_to_label:
        if n["type"] == "function_call" and n.get("called_function_code"):
            parts.append(
                f'{n["id"]} [CALLS → {n["called_function"]}]:\n{n["called_function_code"]}'
            )
        else:
            parts.append(f'{n["id"]}: {n["raw_code"] or "(no code)"}')
    steps = "\n\n".join(parts)

    prompt = LABELING_PROMPT.format(
        function_name=state["function_name"],
        steps=steps,
    )

    response = model.invoke(prompt)
    return {
        **state,
        "labels": [
            {
                "node_id": l.node_id,
                "label": l.label,
                "call_description": l.call_description,
                "call_output": l.call_output,
            }
            for l in response.labels
        ],
    }


def build_labeling_graph():
    graph = StateGraph(LabelState)
    graph.add_node("label", label_nodes)
    graph.set_entry_point("label")
    graph.add_edge("label", END)
    return graph.compile()


labeling_graph = build_labeling_graph()


def label_function(function_name: str, nodes: list[dict]) -> dict[str, dict]:
    result = labeling_graph.invoke({
        "function_name": function_name,
        "nodes": nodes,
        "labels": [],
    })
    return {
        item["node_id"]: {
            "label": item["label"],
            "call_description": item.get("call_description"),
            "call_output": item.get("call_output"),
        }
        for item in result["labels"]
    }
