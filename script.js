  const INGEST_URL = "http://localhost:5678/webhook-test/ingest";
  const ASK_URL = "http://localhost:5678/webhook-test/ask";

  const thread = document.getElementById('thread');
  const fileInput = document.getElementById('fileInput');
  const attachBtn = document.getElementById('attachBtn');
  const questionEl = document.getElementById('question');
  const sendBtn = document.getElementById('sendBtn');
  const docStatus = document.getElementById('docStatus');
  const composerForm = document.getElementById('composerForm');

  let docReady = false;

  function fileIconSvg() {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
  }

  function scrollToEnd() {
    thread.scrollTop = thread.scrollHeight;
  }

  function addMessage(role, { text, fileName } = {}) {
    const msg = document.createElement('div');
    msg.className = 'msg ' + role;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    if (fileName) {
      const chip = document.createElement('div');
      chip.className = 'file-chip';
      chip.innerHTML = fileIconSvg() + '<span></span>';
      chip.querySelector('span').textContent = fileName;
      bubble.appendChild(chip);
      if (text) {
        const p = document.createElement('div');
        p.style.marginTop = '8px';
        p.textContent = text;
        bubble.appendChild(p);
      }
    } else {
      bubble.textContent = text;
    }

    msg.appendChild(bubble);
    thread.appendChild(msg);
    scrollToEnd();
    return msg;
  }

  function addTyping() {
    const msg = document.createElement('div');
    msg.className = 'msg agent';
    msg.id = 'typingMsg';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
    msg.appendChild(bubble);
    thread.appendChild(msg);
    scrollToEnd();
  }

  function removeTyping() {
    const el = document.getElementById('typingMsg');
    if (el) el.remove();
  }

  attachBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    addMessage('user', { fileName: file.name });
    addTyping();

    const formData = new FormData();
    formData.append('data', file);

    try {
      const res = await fetch(INGEST_URL, { method: 'POST', body: formData });
      const data = await res.json();
      removeTyping();
      docReady = true;
      docStatus.classList.add('ready');
      docStatus.innerHTML = '<span class="dot"></span>' + file.name + ' is indexed and ready';
      addMessage('agent', { text: "Got it — I've read through " + file.name + ". Ask me anything about it." });
    } catch (err) {
      removeTyping();
      addMessage('agent', { text: "I couldn't reach the document service: " + err.message });
    } finally {
      fileInput.value = '';
    }
  });

  composerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = questionEl.value.trim();
    if (!question) return;

    addMessage('user', { text: question });
    questionEl.value = '';
    questionEl.style.height = 'auto';
    addTyping();

    try {
      const res = await fetch(ASK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      const data = await res.json();
      removeTyping();
      addMessage('agent', { text: data.answer || "I didn't get an answer back for that one." });
    } catch (err) {
      removeTyping();
      addMessage('agent', { text: "Something went wrong: " + err.message });
    }
  });

  questionEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      composerForm.requestSubmit();
    }
  });

  questionEl.addEventListener('input', () => {
    questionEl.style.height = 'auto';
    questionEl.style.height = Math.min(questionEl.scrollHeight, 120) + 'px';
  });