from flask import Flask, render_template, request, jsonify
import openai
import os
# from dotenv import load_dotenv

# .env 파일에서 환경변수 로드
# load_dotenv()

app = Flask(__name__)

# OpenAI API 키 설정
openai.api_key = os.getenv('OPENAI_API_KEY')

@app.route('/')
def index():
    """메인 페이지 - 채팅 UI 렌더링"""
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    """채팅 메시지 처리"""
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({'error': '메시지가 비어있습니다.'}), 400
        
        # OpenAI API 호출
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "당신은 도움이 되는 AI 어시스턴트입니다. 친근하고 정확한 답변을 제공해주세요."},
                {"role": "user", "content": user_message}
            ],
            max_tokens=1000,
            temperature=0.7
        )
        
        bot_response = response.choices[0].message.content
        
        return jsonify({
            'user_message': user_message,
            'bot_response': bot_response
        })
        
    except Exception as e:
        return jsonify({'error': f'오류가 발생했습니다: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
