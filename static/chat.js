const chat = document.getElementById("chat");
const saved = document.getElementById("saved");
const form = document.getElementById("form");
const input = document.getElementById("input");
const send = document.getElementById("send");
const clearButton = document.getElementById("clear");
const newChatButton = document.getElementById("new-chat");

const LEGACY_KEY = "web-chatbot-history";
const STATE_KEY = "web-chatbot-state";
const HISTORY_LIMIT = 40;
const CONVERSATION_LIMIT = 20;

const AVATAR = `
  <svg viewBox="0 0 38 38" width="38" height="38" aria-hidden="true">
    <circle cx="19" cy="15" r="6" fill="#3b1e1e"/>
    <ellipse cx="19" cy="29" rx="10" ry="7" fill="#3b1e1e"/>
  </svg>
`;

let activeId = "";
let conversations = [];
let history = [];

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeMessages(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => {
      return item
        && (item.role === "user" || item.role === "bot")
        && typeof item.text === "string"
        && item.text.trim()
        && !Number.isNaN(Date.parse(item.time));
    })
    .slice(-HISTORY_LIMIT)
    .map((item) => ({
      role: item.role,
      text: item.text.trim(),
      time: new Date(item.time).toISOString(),
    }));
}

function snapshot(messages) {
  return messages.map((item) => ({
    role: item.role,
    text: item.text,
    time: item.time,
  }));
}

function titleFrom(messages) {
  const firstUser = messages.find((item) => item.role === "user");
  if (!firstUser) return "새 대화";
  const text = firstUser.text.replace(/\s+/g, " ").trim();
  return text.length > 16 ? `${text.slice(0, 16)}…` : text;
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STATE_KEY) || "null");
    if (parsed && Array.isArray(parsed.conversations)) {
      conversations = parsed.conversations
        .map((conversation) => ({
          id: typeof conversation.id === "string" ? conversation.id : createId(),
          messages: normalizeMessages(conversation.messages),
        }))
        .filter((conversation) => conversation.messages.length)
        .slice(0, CONVERSATION_LIMIT)
        .map((conversation) => ({
          ...conversation,
          title: titleFrom(conversation.messages),
        }));
      const active = conversations.find((conversation) => conversation.id === parsed.activeId);
      if (active) {
        activeId = active.id;
        history = snapshot(active.messages);
      } else {
        activeId = typeof parsed.activeId === "string" ? parsed.activeId : createId();
        history = [];
      }
      return;
    }
  } catch (error) {
    conversations = [];
  }

  let legacy = [];
  try {
    legacy = normalizeMessages(JSON.parse(localStorage.getItem(LEGACY_KEY) || "[]"));
  } catch (error) {
    legacy = [];
  }

  activeId = createId();
  history = legacy;
  conversations = legacy.length
    ? [{ id: activeId, title: titleFrom(legacy), messages: snapshot(legacy) }]
    : [];
  localStorage.removeItem(LEGACY_KEY);
  if (legacy.length) saveState();
}

function saveState() {
  if (history.length) {
    const conversation = {
      id: activeId,
      title: titleFrom(history),
      messages: snapshot(history),
    };
    const index = conversations.findIndex((item) => item.id === activeId);
    if (index >= 0) conversations[index] = conversation;
    else conversations.unshift(conversation);
  } else {
    conversations = conversations.filter((item) => item.id !== activeId);
  }

  conversations = conversations.slice(0, CONVERSATION_LIMIT);
  localStorage.setItem(STATE_KEY, JSON.stringify({
    activeId,
    conversations,
  }));
  renderSaved();
}

function formatDate(date) {
  const weekdays = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${weekdays[date.getDay()]}`;
}

function formatTime(date) {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const period = hours < 12 ? "오전" : "오후";
  const hour12 = hours % 12 || 12;
  return `${period} ${hour12}:${minutes}`;
}

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function pinToBottom() {
  chat.scrollTop = chat.scrollHeight;
  requestAnimationFrame(() => {
    chat.scrollTop = chat.scrollHeight;
  });
}

function addDateChip(date) {
  const chip = document.createElement("div");
  chip.className = "date-chip";
  chip.textContent = formatDate(date);
  chat.appendChild(chip);
}

function ensureDateChip(date) {
  const key = dayKey(date);
  if (chat.dataset.lastDay === key) return;
  addDateChip(date);
  chat.dataset.lastDay = key;
}

function appendBubble(role, text, date) {
  const row = document.createElement("div");
  row.className = `message ${role}`;

  const bubbleRow = document.createElement("div");
  bubbleRow.className = "bubble-row";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  const label = role === "user" ? "You:" : "Bot:";
  bubble.textContent = `${label} ${text}`;

  const time = document.createElement("time");
  time.className = "time";
  time.dateTime = date.toISOString();
  time.textContent = formatTime(date);

  if (role === "bot") {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.innerHTML = AVATAR;

    const body = document.createElement("div");
    body.className = "message-body";

    const name = document.createElement("div");
    name.className = "name";
    name.textContent = "Bot";

    bubbleRow.append(bubble, time);
    body.append(name, bubbleRow);
    row.append(avatar, body);
  } else {
    bubbleRow.append(time, bubble);
    row.append(bubbleRow);
  }

  chat.appendChild(row);
  return row;
}

function renderHistory() {
  chat.replaceChildren();
  delete chat.dataset.lastDay;

  if (history.length === 0) {
    ensureDateChip(new Date());
    return;
  }

  for (const item of history) {
    const date = new Date(item.time);
    ensureDateChip(date);
    appendBubble(item.role, item.text, date);
  }
  pinToBottom();
}

function remember(role, text) {
  const date = new Date();
  history.push({ role, text, time: date.toISOString() });
  if (history.length > HISTORY_LIMIT) {
    history = history.slice(-HISTORY_LIMIT);
  }
  saveState();

  if (history.length === HISTORY_LIMIT && chat.querySelectorAll(".message").length >= HISTORY_LIMIT) {
    renderHistory();
    return null;
  }

  ensureDateChip(date);
  const row = appendBubble(role, text, date);
  pinToBottom();
  return row;
}

function toApiMessages() {
  return history.map((item) => ({
    role: item.role === "user" ? "user" : "assistant",
    content: item.text,
  }));
}

function renderSaved() {
  const others = conversations.filter((conversation) => {
    return conversation.id !== activeId && conversation.messages.length;
  });
  saved.replaceChildren();
  saved.hidden = others.length === 0;
  if (!others.length) return;

  const label = document.createElement("p");
  label.className = "saved-label";
  label.textContent = "이전 대화";

  const list = document.createElement("div");
  list.className = "saved-list";
  for (const conversation of others) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "saved-item";
    button.textContent = conversation.title;
    button.addEventListener("click", () => openConversation(conversation.id));
    list.append(button);
  }

  saved.append(label, list);
}

function openConversation(id) {
  const conversation = conversations.find((item) => item.id === id);
  if (!conversation) return;
  saveState();
  activeId = conversation.id;
  history = snapshot(conversation.messages);
  saveState();
  renderHistory();
  input.focus();
}

function startNewChat() {
  if (!history.length) {
    input.focus();
    return;
  }
  saveState();
  activeId = createId();
  history = [];
  saveState();
  renderHistory();
  input.focus();
}

loadState();
renderSaved();
renderHistory();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = input.value.trim();
  if (!message) return;

  remember("user", message);
  input.value = "";
  input.disabled = true;
  send.disabled = true;

  const pending = appendBubble("bot", "답변을 작성하는 중...", new Date());
  pinToBottom();

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: toApiMessages() }),
    });
    const data = await response.json();
    pending.remove();

    if (!response.ok) {
      appendBubble("bot", data.error || "응답을 받지 못했습니다.", new Date());
      pinToBottom();
      return;
    }

    remember("bot", data.reply);
  } catch (error) {
    pending.remove();
    appendBubble("bot", "서버와 통신하지 못했습니다.", new Date());
    pinToBottom();
  } finally {
    input.disabled = false;
    send.disabled = false;
    input.focus();
  }
});

clearButton.addEventListener("click", () => {
  if (!history.length) return;
  if (!window.confirm("이 대화를 지울까요?")) return;
  conversations = conversations.filter((conversation) => conversation.id !== activeId);
  activeId = createId();
  history = [];
  saveState();
  renderHistory();
  input.focus();
});

newChatButton.addEventListener("click", startNewChat);
