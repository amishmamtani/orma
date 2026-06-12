import time
import random

MAX_RETRIES = 3
BACKOFF_BASE = 2

def validate_payload(data):
    if not data:
        return False, "empty payload"
    if not isinstance(data, dict):
        return False, "not a dict"
    if "id" not in data:
        return False, "missing id"
    if not isinstance(data["id"], int) or data["id"] <= 0:
        return False, "invalid id"
    return True, None

def enrich_payload(data):
    if "tags" not in data:
        data["tags"] = []
    if data.get("priority") == "high":
        data["tags"].append("urgent")
        data["score"] = 100
    elif data.get("priority") == "low":
        data["score"] = 10
    else:
        data["score"] = 50
    return data

def call_external_api(data):
    roll = random.random()
    if roll < 0.3:
        raise ConnectionError("network timeout")
    if roll < 0.5:
        raise ValueError("server rejected payload")
    return {"status": "ok", "ref": data["id"] * 7}

def handle_api_error(error, attempt):
    if isinstance(error, ValueError):
        return False
    if attempt >= MAX_RETRIES:
        return False
    wait = BACKOFF_BASE ** attempt
    time.sleep(wait)
    return True

def process_item(data):
    ok, reason = validate_payload(data)
    if not ok:
        return {"error": reason, "success": False}

    data = enrich_payload(data)

    attempt = 0
    result = None
    while attempt <= MAX_RETRIES:
        try:
            result = call_external_api(data)
            break
        except Exception as e:
            should_retry = handle_api_error(e, attempt)
            if not should_retry:
                return {"error": str(e), "success": False}
            attempt += 1

    if result is None:
        return {"error": "exhausted retries", "success": False}

    if result["status"] != "ok":
        return {"error": "bad status", "success": False}

    return {"ref": result["ref"], "score": data["score"], "success": True}

def run_batch(items):
    results = []
    failures = 0
    for item in items:
        outcome = process_item(item)
        if outcome["success"]:
            results.append(outcome)
        else:
            failures += 1
            if failures > len(items) // 2:
                return {"aborted": True, "reason": "too many failures", "partial": results}
    return {"aborted": False, "results": results, "failures": failures}
