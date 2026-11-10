// DOM 요소들
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const chatMessages = document.getElementById('chatMessages');

// 자동 스크롤을 위한 변수
let shouldAutoScroll = true;

// Enter 키로 메시지 전송
messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// 스크롤 이벤트 리스너 - 사용자가 수동으로 스크롤하면 자동 스크롤 비활성화
chatMessages.addEventListener('scroll', function() {
    const isAtBottom = chatMessages.scrollTop + chatMessages.clientHeight >= chatMessages.scrollHeight - 10;
    shouldAutoScroll = isAtBottom;
});

// 메시지 전송 함수
async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message) {
        return;
    }
    
    // 입력창 비우기
    messageInput.value = '';
    
    // 사용자 메시지 표시
    addMessage(message, 'user');
    
    // 사용자가 메시지를 보낼 때는 항상 자동 스크롤 활성화
    shouldAutoScroll = true;
    
    // 전송 버튼 비활성화
    sendButton.disabled = true;
    sendButton.textContent = '⏳';
    
    try {
        // OpenAI API 호출
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // 봇 응답 표시
            addMessage(data.bot_response, 'bot');
        } else {
            // 에러 메시지 표시
            addMessage(`오류: ${data.error}`, 'bot');
        }
        
    } catch (error) {
        console.error('Error:', error);
        addMessage('네트워크 오류가 발생했습니다. 다시 시도해주세요.', 'bot');
    } finally {
        // 전송 버튼 다시 활성화
        sendButton.disabled = false;
        sendButton.textContent = '📤';
    }
}

// 메시지를 채팅창에 추가하는 함수
function addMessage(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = message;
    
    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    messageTime.textContent = getCurrentTime();
    
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(messageTime);
    chatMessages.appendChild(messageDiv);
    
    // 자동 스크롤이 활성화된 경우에만 스크롤을 맨 아래로
    if (shouldAutoScroll) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// 현재 시간을 카카오톡 스타일로 반환하는 함수
function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    const period = hours >= 12 ? '오후' : '오전';
    const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${period} ${displayHours}:${displayMinutes}`;
}

// HTML 이스케이프 함수
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
