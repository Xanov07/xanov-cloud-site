(() => {
    const API_URL = 'https://api.xanov.cloud/chat';
    const MAX_HISTORY = 10;
    const MAX_DISPLAY = 10;

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
        const trimmed = history.slice(-MAX_HISTORY);
        localStorage.setItem('xanov_chat_history', JSON.stringify(trimmed));
    }

    function trimDisplayedMessages() {
        const msgs = messages.querySelectorAll('.chat-msg:not(#chatGreeting)');
        if (msgs.length > MAX_DISPLAY) {
            for (let i = 0; i < msgs.length - MAX_DISPLAY; i++) {
                msgs[i].remove();
            }
        }
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

    const chatI18n = {
        ru: {
            greeting: 'Привет! Я ассистент XanovCompany — помогу подобрать решение под вашу задачу. Расскажите, что хотите автоматизировать?',
            placeholder: 'Написать сообщение...',
            orderBtn: '🛒 Хочу заказать',
            noConnection: 'Нет соединения. Попробуйте позже.',
            error: 'Ошибка. Попробуйте ещё раз.'
        },
        en: {
            greeting: 'Hi! I\'m XanovCompany assistant — I\'ll help you find the right solution. What would you like to automate?',
            placeholder: 'Write a message...',
            orderBtn: '🛒 I want to order',
            noConnection: 'No connection. Please try again later.',
            error: 'Error. Please try again.'
        },
        es: {
            greeting: '¡Hola! Soy el asistente de XanovCompany — te ayudaré a encontrar la solución adecuada. ¿Qué quieres automatizar?',
            placeholder: 'Escribe un mensaje...',
            orderBtn: '🛒 Quiero ordenar',
            noConnection: 'Sin conexión. Intenta más tarde.',
            error: 'Error. Inténtalo de nuevo.'
        },
        uk: {
            greeting: 'Привіт! Я асистент XanovCompany — допоможу підібрати рішення під вашу задачу. Розкажіть, що хочете автоматизувати?',
            placeholder: 'Написати повідомлення...',
            orderBtn: '🛒 Хочу замовити',
            noConnection: 'Немає з\'єднання. Спробуйте пізніше.',
            error: 'Помилка. Спробуйте ще раз.'
        }
    };

    function getChatLang() {
        const lang = localStorage.getItem('lang') || 'ru';
        return chatI18n[lang] || chatI18n.ru;
    }

    function applyChatLang() {
        const t = getChatLang();
        if (input) input.placeholder = t.placeholder;
        if (greeting) {
            const p = greeting.querySelector('p');
            if (p) p.textContent = t.greeting;
        }
        const orderBtnEl = document.querySelector('.chat-order-btn');
        if (orderBtnEl) orderBtnEl.textContent = t.orderBtn;
    }

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
            trimDisplayedMessages();
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

    function showNewChatButton() {
        if (document.getElementById('newChatBtn')) return;
        const wrap = document.createElement('div');
        wrap.className = 'chat-order-wrap';
        wrap.id = 'newChatBtn';
        wrap.innerHTML = `<button class="chat-order-btn chat-order-btn--new">✨ Начать новый чат</button>`;
        wrap.querySelector('button').addEventListener('click', () => {
            clearHistory();
            chatHistory = [];
            messages.innerHTML = '';
            if (greeting) {
                greeting.style.display = '';
                messages.appendChild(greeting);
            }
            localStorage.removeItem('xanov_session_id');
            location.reload();
        });
        messages.appendChild(wrap);
        scrollToBottom();
    }

    function showOrderButton() {
        if (document.getElementById('orderBtn')) return;
        const t = getChatLang();
        const wrap = document.createElement('div');
        wrap.className = 'chat-order-wrap';
        wrap.id = 'orderBtn';
        wrap.innerHTML = `<button class="chat-order-btn">${t.orderBtn}</button>`;
        wrap.querySelector('button').addEventListener('click', () => {
            wrap.remove();
            input.value = t.orderBtn.replace('🛒 ', '');
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

        // Убираем кнопку заказа когда пользователь пишет
        const existingOrderBtn = document.getElementById('orderBtn');
        if (existingOrderBtn) existingOrderBtn.remove();

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

            const reply = data.reply || data.response || data.message || getChatLang().error;
            renderMessage(reply, 'bot');

            if (data.order_mode) {
                setTimeout(() => showNewChatButton(), 600);
            } else {
                setTimeout(() => showOrderButton(), 400);
            }

        } catch {
            removeTyping();
            renderMessage(getChatLang().noConnection, 'bot');
        } finally {
            isLoading = false;
            sendBtn.disabled = false;
            input.focus();
        }

        if (!isOpen) badge.classList.add('visible');
    }

    // Восстанавливаем историю при загрузке страницы
    restoreHistory();


    // Применяем язык при загрузке
    applyChatLang();

    // Следим за сменой языка на сайте
    const langObserver = new MutationObserver(() => applyChatLang());
    const langBtn = document.getElementById('langBtn');
    if (langBtn) langObserver.observe(langBtn, { childList: true, characterData: true, subtree: true });
})();
