(() => {
    const API_URL = 'https://api.xanov.cloud/chat';

    // Генерируем или достаём session_id из localStorage
    function getSessionId() {
        let id = localStorage.getItem('xanov_session_id');
        if (!id) {
            id = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
            localStorage.setItem('xanov_session_id', id);
        }
        return id;
    }

    const sessionId = getSessionId();

    const widget   = document.getElementById('chatWidget');
    const toggle   = document.getElementById('chatToggle');
    const closeBtn = document.getElementById('chatClose');
    const messages = document.getElementById('chatMessages');
    const input    = document.getElementById('chatInput');
    const sendBtn  = document.getElementById('chatSend');
    const badge    = document.getElementById('chatBadge');

    let isOpen = false;
    let isLoading = false;

    // Открыть/закрыть
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

    // Закрыть по клику вне виджета
    document.addEventListener('click', (e) => {
        if (isOpen && !widget.contains(e.target)) closeChat();
    });

    // Отправка по Enter
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

    function addMessage(text, role) {
        const div = document.createElement('div');
        div.className = `chat-msg chat-msg--${role}`;
        div.textContent = text;
        messages.appendChild(div);
        scrollToBottom();
        return div;
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

    async function sendMessage() {
        const text = input.value.trim();
        if (!text || isLoading) return;

        input.value = '';
        isLoading = true;
        sendBtn.disabled = true;

        addMessage(text, 'user');
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
            addMessage(data.reply || 'Ошибка. Попробуйте ещё раз.', 'bot');

            // Если заказ — показываем уведомление
            if (data.order_mode) {
                setTimeout(() => {
                    addMessage('Менеджер свяжется с вами в Telegram в течение часа.', 'bot');
                }, 600);
            }

        } catch {
            removeTyping();
            addMessage('Нет соединения. Попробуйте позже.', 'bot');
        } finally {
            isLoading = false;
            sendBtn.disabled = false;
            input.focus();
        }

        // Если чат закрыт — показываем бейдж
        if (!isOpen) badge.classList.add('visible');
    }
})();
