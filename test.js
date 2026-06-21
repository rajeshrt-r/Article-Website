
        document.addEventListener('DOMContentLoaded', function () {

            // ── PAGE ROUTING ──
            const pageContents = document.querySelectorAll('.page-content');
            function handleRouting() {
                const hash = window.location.hash || '#home';
                const targetId = hash.substring(1);
                pageContents.forEach(s => { s.style.display = 'none'; });
                const target = document.getElementById(targetId);
                if (target) { target.style.display = 'block'; window.scrollTo(0, 0); }
                else { document.getElementById('home').style.display = 'block'; }
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === hash);
                });
            }
            window.addEventListener('hashchange', handleRouting);
            handleRouting();

            // ── MOBILE MENU ──
            const mobileMenu = document.getElementById('mobileMenu');
            const overlay = document.getElementById('overlay');
            document.getElementById('menuToggle').addEventListener('click', () => {
                mobileMenu.classList.remove('-translate-x-full');
                overlay.classList.add('opacity-50', 'pointer-events-auto');
                document.body.style.overflow = 'hidden';
            });
            const closeMenu = () => {
                mobileMenu.classList.add('-translate-x-full');
                overlay.classList.remove('opacity-50', 'pointer-events-auto');
                document.body.style.overflow = '';
            };
            document.getElementById('menuClose').addEventListener('click', closeMenu);
            overlay.addEventListener('click', closeMenu);
            document.querySelectorAll('.mobile-nav-link').forEach(l => l.addEventListener('click', closeMenu));

            // ── AUTH ──
            let isLoggedIn = false;
            const loginForm = document.getElementById('loginFormContainer');
            const signInBtns = [document.getElementById('signInBtnDesktop'), document.getElementById('signInBtnMobile')];
            const signOutBtns = [document.getElementById('signOutBtnDesktop'), document.getElementById('signOutBtnMobile')];
            function updateAuthUI() {
                signInBtns.forEach(b => b.classList.toggle('hidden', isLoggedIn));
                signOutBtns.forEach(b => b.classList.toggle('hidden', !isLoggedIn));
            }
            signInBtns.forEach(b => b.addEventListener('click', () => { loginForm.classList.remove('hidden'); document.body.style.overflow = 'hidden'; closeMenu(); }));
            document.getElementById('closeFormBtn').addEventListener('click', () => { loginForm.classList.add('hidden'); document.body.style.overflow = ''; });
            signOutBtns.forEach(b => b.addEventListener('click', () => { isLoggedIn = false; updateAuthUI(); window.location.hash = '#home'; }));
            updateAuthUI();

            // ── REGISTRATION FORM ──
            const countryStateMap = {
                'india': ['Maharashtra', 'Tamil Nadu', 'Karnataka', 'Uttar Pradesh', 'West Bengal', 'Kerala', 'Gujarat', 'Rajasthan'],
                'usa': ['California', 'Texas', 'New York', 'Florida', 'Washington', 'Illinois'],
                'canada': ['Ontario', 'Quebec', 'British Columbia', 'Alberta'],
                'germany': ['Bavaria', 'Berlin', 'Hamburg', 'Baden-Württemberg'],
                'uk': ['England', 'Scotland', 'Wales', 'Northern Ireland']
            };
            const countrySelect = document.getElementById('country');
            const stateSelect = document.getElementById('state');
            countrySelect.innerHTML = '<option value="">Select country</option>';
            Object.keys(countryStateMap).forEach(c => {
                const o = document.createElement('option'); o.value = c; o.textContent = c.charAt(0).toUpperCase() + c.slice(1);
                countrySelect.appendChild(o);
            });
            function populateStates() {
                stateSelect.innerHTML = '<option value="">Select state</option>';
                if (countryStateMap[countrySelect.value]) {
                    countryStateMap[countrySelect.value].forEach(s => {
                        const o = document.createElement('option'); o.value = s; o.textContent = s;
                        stateSelect.appendChild(o);
                    });
                }
            }
            countrySelect.addEventListener('change', populateStates);

            document.getElementById('registrationForm').addEventListener('submit', function (e) {
                e.preventDefault();
                if (!countrySelect.value || !stateSelect.value) {
                    const fm = document.getElementById('formMessage');
                    fm.textContent = 'Please select country and state.';
                    fm.style.color = '#ef4444'; fm.classList.remove('hidden'); return;
                }
                const fm = document.getElementById('formMessage');
                fm.textContent = '✅ Registration successful! Welcome to RKS Tech World!';
                fm.style.color = '#10b981'; fm.classList.remove('hidden');
                setTimeout(() => {
                    isLoggedIn = true; updateAuthUI();
                    loginForm.classList.add('hidden'); document.body.style.overflow = '';
                    fm.classList.add('hidden'); this.reset(); populateStates();
                    window.location.hash = '#home';
                }, 1800);
            });

            // ── CHATBOT TOGGLE ──
            const chatToggleBtn = document.getElementById('chatToggleBtn');
            const chatWindow = document.getElementById('chatWindow');
            const chatIcon = document.getElementById('chatIcon');
            const closeIcon = document.getElementById('closeIcon');
            const notifDot = document.getElementById('chatNotifDot');

            chatToggleBtn.addEventListener('click', () => {
                const isOpen = chatWindow.classList.contains('open');
                chatWindow.classList.toggle('open', !isOpen);
                chatToggleBtn.classList.toggle('open', !isOpen);
                chatIcon.classList.toggle('hidden', !isOpen);
                closeIcon.classList.toggle('hidden', isOpen);
                notifDot.style.display = 'none';
            });

            // Hide notif dot after 4s
            setTimeout(() => { notifDot.style.display = 'none'; }, 4000);

            // Welcome message
            addBotMessage(`👋 **Hey! Welcome to RKS Tech World!**\n\nI'm your AI assistant, here to help you with:\n\n🌐 **About RKS** – Our team, mission, and what we do\n💻 **Tech Help** – Web dev, cybersecurity, system design\n🎲 **Random Chat** – Ask me anything!\n\nUse the tabs above to switch modes. What can I help you with today?`);
        });

        // ──────────────────────────────────────────────
        // CHATBOT ENGINE
        // ──────────────────────────────────────────────

        let chatMode = 'about';
        let conversationHistory = [];
        let isWaiting = false;
        let userProfile = { name: null, interests: [], messageCount: 0 };

        // 🧠 Site Knowledge Base (Injected into system prompts)
        const siteKnowledge = `
[KNOWLEDGE BASE: RKS TECH WORLD]
- **Founding**: Founded by Rajesh.RT (Founder & Chief Architect, Ph: +91 76958 67002). Based in Chennai, India.
- **Team**: Rajakirubakaran.A (Head of Cyber Security Research, Ph: +91 97880 83194), Satyaprakash.T (Lead Web Developer, Ph: +91 63816 21681).
- **Mission**: Empower developers globally with high-quality, actionable content on scalability, security, and next-gen architecture.
- **Sections Available**: 
  - [Home](#home)
  - [About Us](#about)
  - [Web Development](#webdev)
  - [Cyber Security](#cybersec)
  - [Large-Scale Dev](#largescale)
  - [Articles](#articles)
- **Articles Library**: 
  - [Zero Trust in Practice: Implementation Roadmap](#article-cyber-security) - Cyber security guide on transitioning to Zero Trust model.
  - [Kafka vs RabbitMQ: Choosing Your Message Broker](#article-kafka) - Large-scale systems comparison of message brokers.
  - [Core Web Vitals 2024: Beyond LCP and CLS](#article-cwv) - Web dev guide to modern performance metrics and SEO optimization.
  - [Scalable System Design: Building Apps for Millions](#article-scalable-design) - Comprehensive guide on horizontal scaling, microservices, and system architecture.
`;

        const baseRules = `
Formatting rules — ALWAYS follow:
- Use **bold** for emphasis.
- Use bullet lists (- item) when listing things.
- When referencing a section or article from the Knowledge Base, ALWAYS provide a clickable markdown link formatted as: [Link Text](#hash) (e.g. [Web Dev Section](#webdev) or [Zero Trust Article](#article-cyber-security)).
- Wrap code in triple backticks with language.
`;

        // System prompts per mode
        const systemPrompts = {
            about: `You are the friendly AI assistant for RKS Tech World. 
${siteKnowledge}
Your job is to help users navigate the site and learn about the team and mission. 
${baseRules}
Be warm and helpful.`,

            mentor: `You are an AI Tech Mentor for RKS Tech World.
${siteKnowledge}
Your job is to teach concepts step-by-step. Go from beginner to advanced. Use analogies. Ask questions to ensure they understand.
${baseRules}
Act like an encouraging teacher. Recommend articles from the Knowledge Base if relevant.`,

            code: `You are an AI Code Helper.
${siteKnowledge}
Your job is to write code, debug errors, and explain logic clearly. 
${baseRules}
Provide clean, robust code snippets. Use standard best practices.`,

            security: `You are a Cyber Security Expert AI for RKS Tech World.
${siteKnowledge}
Your job is to warn about threats, teach best practices, and explain security concepts.
${baseRules}
Be authoritative but accessible. Recommend the Zero Trust article if relevant.`,

            random: `You are a fun, friendly, witty AI chatbot for RKS Tech World.
${siteKnowledge}
You can chat about anything — tech, life, jokes, random facts, and more.
${baseRules}
Keep responses conversational and lively.`
        };

        const modeChips = {
            about: ['Who is Rajesh.RT?', 'Site Navigation', 'What is RKS?', 'Team members?'],
            mentor: ['Teach me React', 'Explain load balancing', 'How does Zero Trust work?', 'Web Dev basics'],
            code: ['Fix this JavaScript', 'Write a regex', 'CSS centering', 'Python API code'],
            security: ['Phishing examples', 'What is XSS?', 'Password best practices', 'Zero Trust roadmap'],
            random: ['Tell me a tech joke', 'Inspire me!', 'Fun tech fact', 'Future of AI']
        };

        function setMode(mode) {
            chatMode = mode;
            document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
            document.getElementById('tab-' + mode).classList.add('active');

            // Update suggestion chips
            const bar = document.getElementById('suggestionsBar');
            bar.innerHTML = modeChips[mode].map(c =>
                `<button class="suggestion-chip" onclick="sendSuggestion(this.textContent)">${c}</button>`
            ).join('');

        const modeNames = { about: '🌐 About RKS', mentor: '🎓 Mentor', code: '💻 Code', security: '🔐 Security', random: '🎲 Random' };

        function setMode(mode) {
            chatMode = mode;
            document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
            document.getElementById('tab-' + mode).classList.add('active');

            // Update suggestion chips
            const bar = document.getElementById('suggestionsBar');
            bar.innerHTML = modeChips[mode].map(c =>
                `<button class="suggestion-chip" onclick="sendSuggestion(this.textContent)">${c}</button>`
            ).join('');

            addBotMessage(`Switched to **${modeNames[mode]}**! Ask me anything.`);
        }

        function addBotMessage(text) {
            const messages = document.getElementById('chatMessages');
            const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            const div = document.createElement('div');
            div.className = 'msg-row bot';
            div.innerHTML = `
            <div class="msg-avatar">🤖</div>
            <div style="flex:1; max-width:86%;">
                <div class="msg-bubble">${formatMessage(text)}</div>
                <div class="reaction-btns">
                    <button class="reaction-btn" title="Helpful" onclick="this.style.opacity=1;this.nextElementSibling.style.opacity=0.3">👍</button>
                    <button class="reaction-btn" title="Not helpful" onclick="this.style.opacity=1;this.previousElementSibling.style.opacity=0.3">👎</button>
                </div>
                <div class="msg-time">${time}</div>
            </div>`;
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
            checkRecommendations(text);
        }

        function checkRecommendations(botText) {
            const txt = botText.toLowerCase();
            const chips = [];
            if(txt.includes('cyber') || txt.includes('security') || txt.includes('zero trust')) {
                chips.push('Read Zero Trust Article');
            }
            if(txt.includes('scale') || txt.includes('system') || txt.includes('architecture') || txt.includes('kafka')) {
                chips.push('Read Scalable System Design');
                chips.push('Kafka vs RabbitMQ');
            }
            if(txt.includes('web dev') || txt.includes('performance')) {
                chips.push('Read Core Web Vitals');
            }
            
            if(chips.length > 0 && chatMode !== 'about') {
                const uniqueChips = [...new Set(chips)].slice(0, 2);
                const bar = document.getElementById('suggestionsBar');
                // Prefix recommendation chips
                let html = uniqueChips.map(c =>
                    `<button class="suggestion-chip" style="background:rgba(16,185,129,0.2)" onclick="sendSuggestion(this.textContent)">📚 ${c}</button>`
                ).join('');
                // Keep the default ones as well
                html += modeChips[chatMode].slice(0, 2).map(c =>
                    `<button class="suggestion-chip" onclick="sendSuggestion(this.textContent)">${c}</button>`
                ).join('');
                bar.innerHTML = html;
            }
        }

        function addUserMessage(text) {
            const messages = document.getElementById('chatMessages');
            const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            const div = document.createElement('div');
            div.className = 'msg-row user';
            div.innerHTML = `
            <div>
                <div class="msg-bubble">${escapeHtml(text)}</div>
                <div class="msg-time">${time}</div>
            </div>`;
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
        }

        function formatMessage(raw) {
            // 1. Escape HTML first so we render safely
            let text = escapeHtml(raw);

            // 2. Fenced code blocks
            text = text.replace(/```([\w+-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
                const label = lang ? `<span class="code-lang-label">${lang}</span>` : '';
                return `<div class="code-block-wrap">${label}<pre style="position:relative;"><code>${code.trimEnd()}</code><button class="copy-btn" style="position:absolute;top:5px;right:5px;" title="Copy code">📋</button></pre></div>`;
            });
            text = text.replace(/```([^\n]*?)```/g, (_, code) =>
                `<div class="code-block-wrap"><pre style="position:relative;"><code>${code}</code><button class="copy-btn" style="position:absolute;top:5px;right:5px;" title="Copy code">📋</button></pre></div>`);

            // 3. Inline code
            text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

            // 4. Horizontal rules
            text = text.replace(/^---$/gm, '<hr>');

            // 5. Headings
            text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');
            text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>');
            text = text.replace(/^# (.+)$/gm, '<h1>$1</h1>');

            // 6. Links [text](url) -> Navigation aware
            text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:var(--accent); text-decoration:underline; font-weight:600;">$1</a>');

            // 7. Bold and italic
            text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
            text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
            text = text.replace(/_(.+?)_/g, '<em>$1</em>');

            // 8. Blockquotes
            text = text.replace(/^> (.*)$/gm, '<blockquote style="border-left: 3px solid var(--accent); padding-left: 10px; color: var(--text-muted); margin: 8px 0; font-style: italic;">$1</blockquote>');

            // 9. Bullet lists
            text = text.replace(/((?:^[-*] .+\n?)+)/gm, match => {
                const items = match.trim().split('\n')
                    .map(l => `<li>${l.replace(/^[-*] /, '')}</li>`).join('');
                return `<ul>${items}</ul>`;
            });

            // 10. Numbered lists
            text = text.replace(/((?:^\d+\. .+\n?)+)/gm, match => {
                const items = match.trim().split('\n')
                    .map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
                return `<ol>${items}</ol>`;
            });

            // 11. Convert remaining newlines to <br>
            text = text.split(/\n{2,}/).map(block => {
                if (/^<(h[1-3]|ul|ol|pre|div|hr|blockquote)/.test(block.trim())) return block.trim();
                const lines = block.replace(/\n/g, '<br>').trim();
                return lines ? `<p>${lines}</p>` : '';
            }).join('');

            return text;
        }

        function escapeHtml(t) {
            return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        function showTyping() {
            const ti = document.getElementById('typingIndicator');
            ti.style.display = 'flex';
            document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
        }

        function hideTyping() {
            document.getElementById('typingIndicator').style.display = 'none';
        }

        function sendSuggestion(text) {
            document.getElementById('chatInput').value = text;
            sendMessage();
        }

        function clearChat() {
            if (confirm('Are you sure you want to clear the chat history?')) {
                document.getElementById('chatMessages').innerHTML = '';
                conversationHistory = [];
                localStorage.removeItem('chatHistory');
                addBotMessage('🔄 Chat cleared! Start fresh — ask me anything.');
            }
        }

        // Dark mode toggle
        const darkToggle = document.getElementById('darkModeToggle');
        darkToggle.addEventListener('click', () => {
            const chatWin = document.getElementById('chatWindow');
            const isDark = chatWin.classList.toggle('dark-mode');
            localStorage.setItem('chatDarkMode', isDark);
        });
        // Load dark mode preference
        const savedDark = localStorage.getItem('chatDarkMode') === 'true';
        if (savedDark) document.getElementById('chatWindow').classList.add('dark-mode');

        // Persistence load
        const savedHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        savedHistory.forEach(msg => {
            if (msg.role === 'user') addUserMessage(msg.content);
            else addBotMessage(msg.content);
            conversationHistory.push(msg);
        });

        // Override addBotMessage and addUserMessage to store history
        const _addBotMessage = addBotMessage;
        const _addUserMessage = addUserMessage;
        addBotMessage = function (text) {
            _addBotMessage(text);
            conversationHistory.push({ role: 'assistant', content: text });
            localStorage.setItem('chatHistory', JSON.stringify(conversationHistory));
        };
        addUserMessage = function (text) {
            _addUserMessage(text);
            conversationHistory.push({ role: 'user', content: text });
            localStorage.setItem('chatHistory', JSON.stringify(conversationHistory));
        };

        // Copy button handler (event delegation)
        document.getElementById('chatMessages').addEventListener('click', e => {
            if (e.target.classList.contains('copy-btn')) {
                const msg = e.target.closest('.msg-row').querySelector('.msg-bubble').innerText;
                navigator.clipboard.writeText(msg).then(() => {
                    e.target.textContent = '✅';
                    setTimeout(() => e.target.textContent = '📋', 1500);
                });
            }
        });

        async function sendMessage() {
            const input = document.getElementById('chatInput');
            const userText = input.value.trim();
            if (!userText || isWaiting) return;

            input.value = '';
            input.style.height = 'auto';
            isWaiting = true;
            document.getElementById('sendBtn').disabled = true;

            addUserMessage(userText);
            conversationHistory.push({ role: 'user', content: userText });

            showTyping();

            try {
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'claude-sonnet-4-20250514',
                        max_tokens: 1000,
                        system: systemPrompts[chatMode],
                        messages: conversationHistory
                    })
                });

                const data = await response.json();
                const botReply = data.content?.[0]?.text || 'Sorry, I could not get a response. Please try again!';

                hideTyping();
                conversationHistory.push({ role: 'assistant', content: botReply });
                addBotMessage(botReply);

            } catch (err) {
                hideTyping();
                // Fallback random responses if API fails
                const fallbacks = [
                    `## ⚡ Connection Hiccup!
No worries — I'll be back in a moment. While you wait:

**Fun Tech Fact:** The first computer bug was an actual bug — a moth found trapped in a relay of the Harvard Mark II computer in 1947! 🦟

*Try your message again in a few seconds.*`,

                    `## 🔌 Briefly Offline
Cloud is taking a quick nap! Meanwhile:

**Did you know?**
- RKS Tech World covers **Web Dev**, **Cyber Security** & **Large-Scale Systems**
- Founded by **Rajesh.RT** in Chennai, India 🇮🇳
- Our AI assistant runs on Claude (Anthropic)

*Please resend your message — it should work shortly!*`,

                    `## 🛰️ Signal Lost
Temporary connectivity issue. Quick insight while we reconnect:

**Web Dev Fact:** The average webpage size has grown **100x** since 1995. That's why Core Web Vitals and performance optimization matter more than ever! 🚀

*Try again — I'm almost back online.*`
                ];
                addBotMessage(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
            } finally {
                isWaiting = false;
                document.getElementById('sendBtn').disabled = false;
            }
        }

        // Enter key to send (Shift+Enter for newline)
        document.getElementById('chatInput').addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Auto-resize textarea
        document.getElementById('chatInput').addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 100) + 'px';
        });
    
