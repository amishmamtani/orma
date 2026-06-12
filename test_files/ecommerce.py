def get_product(product_id):
    catalog = {
        1: {"name": "Shirt", "price": 29.99, "stock": 10},
        2: {"name": "Pants", "price": 49.99, "stock": 5},
        3: {"name": "Shoes", "price": 89.99, "stock": 0},
    }
    return catalog.get(product_id)


def check_stock(product):
    return product is not None and product["stock"] > 0


def apply_discount(price, discount_percent):
    discount = price * (discount_percent / 100)
    return round(price - discount, 2)


def calculate_cart_total(cart_items):
    total = 0
    for item in cart_items:
        total += item["price"] * item["quantity"]
    return round(total, 2)


def place_order(user_id, cart_items):
    total = calculate_cart_total(cart_items)
    order = {
        "user_id": user_id,
        "items": cart_items,
        "total": total,
        "status": "confirmed",
    }
    return order
