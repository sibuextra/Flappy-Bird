function sendMessage() {
  const input = document.getElementById("message-input");
  const message = input.value.trim();
  if (!message) return;

  const messages = document.getElementById("messages");

  const msgDiv = document.createElement("div");
  msgDiv.className = "message";
  msgDiv.textContent = message;

  messages.appendChild(msgDiv);
  input.value = "";
  messages.scrollTop = messages.scrollHeight;
}