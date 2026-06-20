"""
Hello World — skill issue vs. for loop supremacy.
"""


def skill_issue_edition():
    """Print hello world ten times. By hand. Like an animal."""
    print("hello world")
    print("hello world")
    print("hello world")
    print("hello world")
    print("hello world")
    print("hello world")
    print("hello world")
    print("hello world")
    print("hello world")
    print("hello world")


def for_loop_supremacy():
    """Print hello world ten times — but every third one is feeling itself."""
    for count in range(1, 11):
        if count % 3 == 0:
            print("HELLO WORLD")
        else:
            print("hello world")


def main():
    skill_issue_edition()
    for_loop_supremacy()


main()
