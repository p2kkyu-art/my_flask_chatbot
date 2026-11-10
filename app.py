import os
from pathlib import Path

# from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from openai import OpenAI

ENV_PATH = Path(r"C:\env\.env")
# load_dotenv(ENV_PATH)

app = Flask(__name__)


def get_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY를 C:\\env\\.env에서 찾지 못했습니다."
        )
    return OpenAI(api_key=api_key)


@app.get("/")
def index():
    return render_template("index.html")


def build_input(messages):
    if not isinstance(messages, list) or not messages:
        return None

    cleaned = []
    for item in messages[-40:]:
        if not isinstance(item, dict):
            continue
        role = item.get("role")
        content = item.get("content")
        if role not in ("user", "assistant") or not isinstance(content, str):
            continue
        content = content.strip()
        if not content:
            continue
        cleaned.append({"role": role, "content": content[:4000]})

    if not cleaned or cleaned[-1]["role"] != "user":
        return None
    return cleaned


@app.post("/chat")
def chat():
    data = request.get_json(silent=True) or {}
    conversation = build_input(data.get("messages"))
    if conversation is None:
        return jsonify({"error": "메시지를 입력해 주세요."}), 400

    try:
        client = get_client()
        response = client.responses.create(
            model="gpt-4o-mini",
            instructions="You are a helpful assistant. Reply in the same language as the user. Use the conversation history when it is relevant.",
            input=conversation,
        )
        reply = (response.output_text or "").strip()
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 500
    except Exception:
        return jsonify({"error": "모델 응답을 가져오지 못했습니다."}), 502

    if not reply:
        return jsonify({"error": "모델이 빈 응답을 반환했습니다."}), 502

    return jsonify({"reply": reply})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
