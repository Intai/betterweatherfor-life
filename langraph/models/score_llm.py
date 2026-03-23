import os

provider = os.environ.get("LANGGRAPH_LLM_PROVIDER", "gemini")

if provider == "xai":
    from langchain_xai import ChatXAI

    score_llm = ChatXAI(model="grok-4.20-reasoning", temperature=0)
else:
    from langchain_google_genai import ChatGoogleGenerativeAI

    score_llm = ChatGoogleGenerativeAI(
        model="gemini-3.1-pro-preview",
        temperature=0,
        google_api_key=os.environ.get("GOOGLE_GEMINI_API_KEY"),
    )
