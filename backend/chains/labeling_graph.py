from typing import TypedDict
from langgraph.graph import StateGraph, END
from pydantic import BaseModel
from config import get_model

LABELING_PROMPT = """You are labeling steps in a software application for a non-technical user who has never seen code.

Given the following code steps from the function `{function_name}`, write a short plain-English label (under 10 words) for each step.

Rules:
- Use product language, not developer terms (avoid: function, method, loop, iterate, variable, return, instantiate, import)
- Active voice: "Filter active orders" not "Active order filtering"
- Be specific to what THIS step does
- For condition steps, phrase as a natural yes/no question — but PRESERVE the logical direction of the code exactly. "Yes" means the condition was true and the indented body ran. "No" means it was false and execution continued past the block. If the code uses a negation like `if not user:` or `if user is None:`, the question must reflect that: "Is the user missing?" not "Is the user found?" — because "Yes" maps to the body (user was missing), not the continuation.
- For loop steps, describe what is being processed: "For each order in the list"
- For end/output steps, distinguish between two cases:
  1. Early exits (returning None, False, an empty value, or an error mid-function): use "Stops here — [reason]" e.g. "Stops here — user not found" or "Stops here — wrong password"
  2. Normal completion (the final return at the end of the function): use "Done — outputs [what the return expression literally is]". Be literal — do NOT infer what happened to the value before this line. If the code says `return users_db`, say "Done — outputs the user database", not "Done — outputs the updated user database". Any changes are shown in the action steps above, not here.

Steps to label:
{steps}

Return a label for every node_id listed."""


class NodeLabel(BaseModel):
    node_id: str
    label: str


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
    steps = "\n".join(
        f'{n["id"]}: {n["raw_code"] or "(no code)"}'
        for n in nodes_to_label
    )
    prompt = LABELING_PROMPT.format(
        function_name=state["function_name"],
        steps=steps,
    )

    response = model.invoke(prompt)
    return {
        **state,
        "labels": [{"node_id": l.node_id, "label": l.label} for l in response.labels],
    }


def build_labeling_graph():
    graph = StateGraph(LabelState)
    graph.add_node("label", label_nodes)
    graph.set_entry_point("label")
    graph.add_edge("label", END)
    return graph.compile()


labeling_graph = build_labeling_graph()


def label_function(function_name: str, nodes: list[dict]) -> dict[str, str]:
    result = labeling_graph.invoke({
        "function_name": function_name,
        "nodes": nodes,
        "labels": [],
    })
    return {item["node_id"]: item["label"] for item in result["labels"]}
