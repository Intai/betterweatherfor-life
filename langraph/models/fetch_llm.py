import os

provider = os.environ.get("LANGGRAPH_LLM_PROVIDER", "gemini")

if provider == "xai":
    from langchain_xai import ChatXAI

    fetch_llm = ChatXAI(model="grok-4-1-fast-reasoning", temperature=0)
else:
    from langchain_google_genai import ChatGoogleGenerativeAI

    fetch_llm = ChatGoogleGenerativeAI(
        model="gemini-3-flash-preview",
        temperature=0,
        google_api_key=os.environ.get("GOOGLE_GEMINI_API_KEY"),
    )
