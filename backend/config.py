import os
from langchain_anthropic import ChatAnthropic


def get_model():
    return ChatAnthropic(
        model="claude-haiku-4-5",
        api_key=os.environ["ANTHROPIC_API_KEY"],
    )
