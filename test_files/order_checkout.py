def check_inventory(item_id, quantity):
    stock = {"A1": 10, "B2": 3, "C3": 0}
    available = stock.get(item_id, 0)
    if available == 0:
        return False, "item not found"
    if available < quantity:
        return False, "not enough stock"
    return True, available


def apply_discount(price, user_tier):
    if user_tier == "gold":
        return price * 0.8
    elif user_tier == "silver":
        return price * 0.9
    return price


def calculate_total(items, user_tier):
    total = 0
    for item in items:
        ok, result = check_inventory(item["id"], item["qty"])
        if not ok:
            return None, result
        discounted = apply_discount(item["price"], user_tier)
        total += discounted * item["qty"]
    return total, None


def process_checkout(user, items):
    if not user:
        return {"success": False, "error": "no user"}
    if not items:
        return {"success": False, "error": "empty cart"}

    total, error = calculate_total(items, user.get("tier", "basic"))
    if error:
        return {"success": False, "error": error}

    if total > user.get("credit_limit", 500):
        return {"success": False, "error": "over credit limit"}

    return {"success": True, "total": total, "user": user["name"]}
