def create_post(title, body, author):
    return {
        "title": title,
        "body": body,
        "author": author,
        "likes": 0,
        "comments": [],
    }


def add_comment(post, author, text):
    comment = {"author": author, "text": text}
    post["comments"].append(comment)
    return post


def like_post(post):
    post["likes"] += 1
    return post


def search_posts(posts, keyword):
    results = []
    for post in posts:
        if keyword.lower() in post["title"].lower() or keyword.lower() in post["body"].lower():
            results.append(post)
    return results


def get_popular_posts(posts, min_likes=10):
    popular = [post for post in posts if post["likes"] >= min_likes]
    return sorted(popular, key=lambda p: p["likes"], reverse=True)
