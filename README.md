# Flask 웹 챗봇

OpenAI GPT-4o-mini 모델을 사용하는 간단한 웹 챗봇 서버입니다.

## 기능

- 실시간 채팅 인터페이스
- OpenAI GPT-4o-mini 모델 연동
- 사용자 메시지는 오른쪽 파란색 말풍선
- 봇 메시지는 왼쪽 회색 말풍선
- 비동기 요청으로 새로고침 없는 채팅
- 반응형 디자인

## 설치 및 실행

1. 필요한 패키지 설치:
```bash
pip install -r requirements.txt
```

2. 환경변수 설정:
   - `env_example.txt` 파일을 `.env`로 복사
   - `.env` 파일에서 `OPENAI_API_KEY`에 실제 OpenAI API 키 입력

3. 서버 실행:
```bash
python app.py
```

4. 브라우저에서 `http://localhost:5000` 접속

## 파일 구조

```
Web_Chatbot_Project/
├── app.py                 # Flask 서버 메인 파일
├── requirements.txt       # 필요한 Python 패키지
├── env_example.txt       # 환경변수 예시 파일
├── templates/
│   └── index.html        # 메인 HTML 템플릿
└── static/
    ├── style.css         # CSS 스타일
    └── script.js         # JavaScript 기능
```

## 사용법

1. 웹페이지에서 메시지 입력창에 질문 입력
2. Enter 키 또는 전송 버튼 클릭
3. AI 봇의 응답을 확인

## 주의사항

- OpenAI API 키가 필요합니다
- API 사용량에 따라 비용이 발생할 수 있습니다
