import { API_BASE } from "./config.js";

const hero = document.getElementById("hero");
const chatShell = document.getElementById("chatShell");
const btnStart = document.getElementById("btnStart");
const btnEnd = document.getElementById("btnEnd");
const formSend = document.getElementById("formSend");
const inputMsg = document.getElementById("inputMsg");
const messagesEl = document.getElementById("messages");
const chatStatus = document.getElementById("chatStatus");

const modalBackdrop = document.getElementById("modalBackdrop");
const modalKey = document.getElementById("modalKey");
const formKey = document.getElementById("formKey");
const apiKeyInput = document.getElementById("apiKeyInput");
const btnCancelKey = document.getElementById("btnCancelKey");

/** @type {string | null} */
let sessionApiKey = null;
/** @type {{ role: 'user' | 'model', text: string }[]} */
let history = [];

function chatEndpointUrl() {
  const base = (API_BASE || "").replace(/\/$/, "");
  return `${base}/api/chat`;
}

function setModalOpen(open) {
  modalBackdrop.classList.toggle("hidden", !open);
  modalKey.classList.toggle("hidden", !open);
  modalKey.setAttribute("aria-hidden", open ? "false" : "true");
  if (open) {
    apiKeyInput.focus();
  }
}

function setChatOpen(open) {
  hero.classList.toggle("hidden", open);
  chatShell.classList.toggle("hidden", !open);
  chatShell.setAttribute("aria-hidden", open ? "false" : "true");
}

function appendMessage(role, text, variant) {
  const div = document.createElement("div");
  div.className = `msg msg-${variant || role}`;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function showError(text) {
  appendMessage("model", text, "error");
}

function resetChat() {
  sessionApiKey = null;
  history = [];
  messagesEl.innerHTML = "";
  inputMsg.value = "";
  chatStatus.textContent = "Listo";
  setChatOpen(false);
}

function normalizeUserEndPhrase(text) {
  const t = text.trim().toLowerCase();
  const phrases = [
    "no tengo más preguntas",
    "no tengo mas preguntas",
    "no más preguntas",
    "no mas preguntas",
    "terminar",
    "finalizar conversación",
    "finalizar conversacion",
    "eso es todo",
    "gracias, eso es todo",
  ];
  return phrases.some((p) => t.includes(p));
}

async function sendToServer() {
  if (!sessionApiKey) return;

  const r = await fetch(chatEndpointUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey: sessionApiKey,
      history,
    }),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(data.error || "Error al contactar con el servidor.");
  }
  return data.text;
}

btnStart.addEventListener("click", () => {
  setModalOpen(true);
});

btnCancelKey.addEventListener("click", () => {
  setModalOpen(false);
  formKey.reset();
});

modalBackdrop.addEventListener("click", () => {
  setModalOpen(false);
  formKey.reset();
});

formKey.addEventListener("submit", (e) => {
  e.preventDefault();
  const key = apiKeyInput.value.trim();
  if (!key) return;
  sessionApiKey = key;
  formKey.reset();
  setModalOpen(false);
  setChatOpen(true);
  appendMessage(
    "model",
    "Conexión lista. Escribe tu mensaje abajo. Puedes decir que no tienes más preguntas o usar «Finalizar chat» cuando quieras cerrar."
  );
  inputMsg.focus();
});

formSend.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = inputMsg.value.trim();
  if (!text || !sessionApiKey) return;

  inputMsg.value = "";
  appendMessage("user", text);
  history.push({ role: "user", text });

  const btnSend = document.getElementById("btnSend");
  btnSend.disabled = true;
  chatStatus.textContent = "Pensando…";

  try {
    const reply = await sendToServer();
    history.push({ role: "model", text: reply });
    appendMessage("model", reply);

    if (normalizeUserEndPhrase(text)) {
      appendMessage(
        "model",
        "Si deseas cerrar, pulsa «Finalizar chat» o sigue escribiendo si cambias de idea."
      );
    }
  } catch (err) {
    history.pop();
    showError(err instanceof Error ? err.message : "Error desconocido.");
  } finally {
    btnSend.disabled = false;
    chatStatus.textContent = "Listo";
    inputMsg.focus();
  }
});

btnEnd.addEventListener("click", () => {
  resetChat();
});

inputMsg.addEventListener("input", () => {
  inputMsg.style.height = "auto";
  inputMsg.style.height = `${Math.min(inputMsg.scrollHeight, 120)}px`;
});
