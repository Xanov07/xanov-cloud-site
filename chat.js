(() => {
    const API_URL = 'https://api.xanov.cloud/chat';
    const MAX_HISTORY = 50; // максимум сообщений в localStorage

    function getSessionId() {
        let id = localStorage.getItem('xanov_session_id');
        if (!id) {
            id = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
            localStorage.setItem('xanov_session_id', id);
        }
        return id;
    }

    function loadHistory() {
        try {
            return JSON.parse(localStorage.getItem('xanov_chat_history') || '[]');
        } catch { return []; }
    }

    function saveHistory(history) {
        // Держим только последние MAX_HISTORY сообщений
        const trimmed = history.slice(-MAX_HISTORY);
        localStorage.setItem('xanov_chat_history', JSON.stringify(trimmed));
    }

    function clearHistory() {
        localStorage.removeItem('xanov_chat_history');
    }

    const sessionId = getSessionId();

    const widget   = document.getElementById('chatWidget');
    const toggle   = document.getElementById('chatToggle');
    const closeBtn = document.getElementById('chatClose');
    const messages = document.getElementById('chatMessages');
    const input    = document.getElementById('chatInput');
    const sendBtn  = document.getElementById('chatSend');
    const badge    = document.getElementById('chatBadge');
    const greeting = document.getElementById('chatGreeting');

    let isOpen = false;
    let isLoading = false;
    let chatHistory = loadHistory();

    // Восстанавливаем историю при загрузке
    function restoreHistory() {
        if (chatHistory.length === 0) return;
        // Скрываем приветствие если есть история
        if (greeting) greeting.style.display = 'none';
        chatHistory.forEach(msg => {
            renderMessage(msg.text, msg.role, false);
        });
        scrollToBottom();
    }

    function renderMessage(text, role, save = true) {
        const div = document.createElement('div');
        div.className = `chat-msg chat-msg--${role}`;
        div.textContent = text;
        messages.appendChild(div);
        if (save) {
            chatHistory.push({ text, role });
            saveHistory(chatHistory);
        }
        return div;
    }

    function openChat() {
        isOpen = true;
        widget.classList.add('active');
        badge.classList.remove('visible');
        input.focus();
        scrollToBottom();
    }

    function closeChat() {
        isOpen = false;
        widget.classList.remove('active');
    }

    toggle.addEventListener('click', () => isOpen ? closeChat() : openChat());
    closeBtn.addEventListener('click', closeChat);

    document.addEventListener('click', (e) => {
        if (isOpen && !widget.contains(e.target)) closeChat();
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    function scrollToBottom() {
        setTimeout(() => messages.scrollTop = messages.scrollHeight, 50);
    }

    function showTyping() {
        const div = document.createElement('div');
        div.className = 'chat-msg chat-msg--bot chat-msg--typing';
        div.id = 'typingIndicator';
        div.innerHTML = '<span></span><span></span><span></span>';
        messages.appendChild(div);
        scrollToBottom();
    }

    function removeTyping() {
        const el = document.getElementById('typingIndicator');
        if (el) el.remove();
    }

    function showOrderButton() {
        if (document.getElementById('orderBtn')) return;
        const wrap = document.createElement('div');
        wrap.className = 'chat-order-wrap';
        wrap.id = 'orderBtn';
        wrap.innerHTML = '<button class="chat-order-btn">🛒 Хочу заказать</button>';
        wrap.querySelector('button').addEventListener('click', () => {
            wrap.remove();
            input.value = 'Хочу заказать';
            sendMessage();
        });
        messages.appendChild(wrap);
        scrollToBottom();
    }

    async function sendMessage() {
        const text = input.value.trim();
        if (!text || isLoading) return;

        input.value = '';
        isLoading = true;
        sendBtn.disabled = true;

        // Скрываем приветствие при первом сообщении
        if (greeting) greeting.style.display = 'none';

        renderMessage(text, 'user');
        showTyping();

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: text,
                    username: ''
                })
            });

            const data = await res.json();
            removeTyping();

            const reply = data.reply || data.response || data.message || 'Ошибка. Попробуйте ещё раз.';
            renderMessage(reply, 'bot');

            if (data.order_mode) {
                setTimeout(() => {
                    renderMessage('Менеджер свяжется с вами в Telegram в течение часа.', 'bot');
                }, 600);
            } else {
                setTimeout(() => showOrderButton(), 400);
            }

        } catch {
            removeTyping();
            renderMessage('Нет соединения. Попробуйте позже.', 'bot');
        } finally {
            isLoading = false;
            sendBtn.disabled = false;
            input.focus();
        }

        if (!isOpen) badge.classList.add('visible');
    }

    // Восстанавливаем историю при загрузке страницы
    restoreHistory();

    // Показываем кнопку заказа если есть история и последнее сообщение от бота
    if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'bot') {
        setTimeout(() => showOrderButton(), 200);
    }
})();
