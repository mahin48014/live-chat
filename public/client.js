// client.js
const socket = io(); // connect to same host by default

// UI elements
const messagesEl = document.getElementById("messages");
const form = document.getElementById("messageForm");
const input = document.getElementById("messageInput");
const nameInput = document.getElementById("nameInput");
const setNameBtn = document.getElementById("setNameBtn");

let myName = localStorage.getItem("chat_name") || "";

// helper to append message
function appendMessage(msg, isMe=false, metaOnly=false) {
  const li = document.createElement("li");
  li.className = "message" + (isMe ? " me" : "");
  if(metaOnly) {
    li.innerHTML = `<div class="meta">${msg}</div>`;
  } else {
    const time = new Date(msg.ts).toLocaleTimeString();
    li.innerHTML = `<div class="meta"><strong>${escapeHtml(msg.name)}</strong> · <span class="small">${time}</span></div>
                    <div class="text">${escapeHtml(msg.text)}</div>`;
  }
  messagesEl.appendChild(li);
  // keep scrolled to bottom
  messagesEl.parentElement.scrollTop = messagesEl.parentElement.scrollHeight;
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// set initial name UI
if(myName) {
  nameInput.value = myName;
  socket.emit("join", myName);
}

// set name button
setNameBtn.addEventListener("click", () => {
  myName = nameInput.value.trim() || "Anonymous";
  localStorage.setItem("chat_name", myName);
  socket.emit("join", myName);
});

// receive history
socket.on("history", (h) => {
  messagesEl.innerHTML = "";
  h.forEach(m => appendMessage(m, false));
});

// user joined / left
socket.on("user-joined", ({name}) => {
  appendMessage(`${name} joined`, false, true);
});
socket.on("user-left", ({name}) => {
  appendMessage(`${name} left`, false, true);
});

// receive single message
socket.on("message", (msg) => {
  const isMe = msg.name === myName;
  appendMessage(msg, isMe);
});

// submit form
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if(!text) return;
  socket.emit("message", text);
  input.value = "";
});