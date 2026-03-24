(() => {
let openai = null;
let systemPromptData = "";
let chatHistory = [];

// DOM Elements
const toggleBtn = document.getElementById('chatbot-toggle');
const closeBtn = document.getElementById('chatbot-close');
const refreshBtn = document.getElementById('chatbot-refresh');
const chatWindow = document.getElementById('chatbot-window');
const messagesContainer = document.getElementById('chatbot-messages');
const inputField = document.getElementById('chatbot-input');
const sendBtn = document.getElementById('chatbot-send');

const defaultGreeting = "Xin chào! 👋 Tôi là trợ lý ảo của trung tâm đào tạo lái xe Thầy Kỳ Phước. Bạn đang quan tâm đến khóa học lái xe hạng B2 hay cần hỗ trợ thông tin gì ạ?";

// 1. Khởi tạo SDK và Load dữ liệu
async function initChatbot() {
    try {
        // Tải dữ liệu chuyên gia để làm Context. Cần bắt lỗi riêng vì fetch trên file:/// sẽ gây ra ngoại lệ.
        try {
            const response = await fetch('chatbot_data.txt');
            if (response.ok) {
                systemPromptData = await response.text();
            } else {
                throw new Error("Không thể fetch file");
            }
        } catch (e) {
            console.warn("Do trình duyệt chặn đọc file nội bộ (CORS origin), không thể liên kết chatbot_data.txt tự động, chuyển sang dùng dữ liệu mặc định bên trong code.");
            systemPromptData = `# Thông tin Trung tâm Đào tạo Lái xe Thầy Kỳ Phước\n- Định vị: Chuyên gia đào tạo lái xe uy tín tại TP.HCM.\n- Cam kết: Dạy 1 kèm 1, xe đời mới Vios/Accent, thực hành đủ 810km DAT.\n- Học phí: Trọn gói không phát sinh, hỗ trợ trả góp.\n- Khóa B2: Số sàn, cho phép hành nghề kinh doanh, phổ biến nhất.\n- Khóa B1: Số tự động, xe gia đình.\n- Liên hệ: 700 Lê Hồng Phong, Q10, TP.HCM - Hotline: 090x.xxx.xxx`;
        }

        resetChat(); // Nạp system prompt và lời chào

        // Tải OpenAI SDK hỗ trợ OpenAI-compatible API
        const module = await import("https://esm.sh/openai");
        const OpenAI = module.default;
        openai = new OpenAI({
            baseURL: "https://9router.vuhai.io.vn/v1",
            apiKey: "sk-4bd27113b7dc78d1-lh6jld-f4f9c69f",
            dangerouslyAllowBrowser: true
        });
    } catch (err) {
        console.error("Lỗi khởi tạo Chatbot:", err);
    }
}

initChatbot();

// 2. Logic Cửa Sổ Chat
toggleBtn.addEventListener('click', () => {
    chatWindow.classList.remove('hidden');
    chatWindow.classList.add('flex');
    toggleBtn.classList.add('hidden');
    // Mở ra thì cuộn xuống cuối
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    inputField.focus();
});

closeBtn.addEventListener('click', () => {
    chatWindow.classList.add('hidden');
    chatWindow.classList.remove('flex');
    toggleBtn.classList.remove('hidden');
});

// 3. Render Tin Nhắn
function appendMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `flex gap-2 text-sm ${role === 'user' ? 'justify-end' : 'justify-start'}`;
    
    const bubble = document.createElement('div');
    if (role === 'user') {
        bubble.className = 'bg-primary text-white p-3.5 rounded-[1.25rem] rounded-tr-sm shadow-sm max-w-[85%]';
        bubble.textContent = text; // Plain text
    } else {
        bubble.className = 'bg-white/80 backdrop-blur-sm border border-slate-100 text-slate-800 p-3.5 rounded-[1.25rem] rounded-tl-sm shadow-sm max-w-[85%] chat-markdown';
        // Render markdown
        bubble.innerHTML = typeof marked !== 'undefined' ? marked.parse(text) : text;
    }

    msgDiv.appendChild(bubble);
    messagesContainer.appendChild(msgDiv);
    
    // Smooth scroll down
    messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: 'smooth'
    });
}

// 4. Reset & Refresh Logic
function resetChat() {
    chatHistory = [
        { 
            role: "system", 
            content: `Vai trò: AI trợ lý tư vấn tuyển sinh cho trung tâm đào tạo lái xe Thầy Kỳ Phước.\nChỉ được trả lời dựa trên Knowledge Base sau:\n${systemPromptData}\n\nQuy tắc:\n- Phải trả lời bằng cú pháp Markdown đẹp mắt.\n- Luôn chào thân thiện, cực kỳ ngắn gọn và súc tích.\n- Nhấn mạnh các chính sách nổi bật (1 kèm 1, bao trọn gói, xe đời mới, chạy đủ 810km DAT).\n- Nếu câu hỏi ngoài phạm vi học lái xe, hãy từ chối nhẹ nhàng và đề nghị liên hệ Hotline.`
        }
    ];
    messagesContainer.innerHTML = ''; // Clear UI
    appendMessage('assistant', defaultGreeting);
}

refreshBtn.addEventListener('click', () => {
    // Animation xoay refresh
    const icon = document.getElementById('refresh-icon');
    icon.style.transform = `rotate(360deg)`;
    icon.style.transition = 'transform 0.5s ease';
    
    resetChat();
    
    // Reset lại style sau 500ms
    setTimeout(() => {
        icon.style.transition = 'none';
        icon.style.transform = `rotate(0deg)`;
        // Force reflow để lần click tiếp theo chạy animation
        void icon.offsetWidth; 
    }, 500);
});

// 5. Typing Animation
function showTyping() {
    const typingId = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = typingId;
    typingDiv.className = 'flex gap-2 text-sm justify-start';
    typingDiv.innerHTML = `
        <div class="bg-white/80 backdrop-blur-sm border border-slate-100 text-slate-500 p-3.5 rounded-[1.25rem] rounded-tl-sm shadow-sm flex gap-1 items-center h-10">
            <div class="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></div>
            <div class="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></div>
            <div class="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></div>
        </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
    return typingId;
}

function removeTyping(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

// 6. Gửi API
async function sendMessage() {
    const text = inputField.value.trim();
    if (!text || !openai) return;

    appendMessage('user', text);
    chatHistory.push({ role: "user", content: text });
    
    inputField.value = '';
    sendBtn.disabled = true;

    const typingId = showTyping();

    try {
        const completion = await openai.chat.completions.create({
            model: "ces-chatbot-gpt-5.4",
            messages: chatHistory
        });
        
        removeTyping(typingId);

        if (completion.choices && completion.choices.length > 0) {
            const reply = completion.choices[0].message.content;
            chatHistory.push({ role: "assistant", content: reply });
            appendMessage('assistant', reply);
        } else {
            console.error(completion);
            appendMessage('assistant', "Xin lỗi, hệ thống đang bận. Bạn thử lại nha.");
        }
    } catch (error) {
        console.error("Lỗi OpenAI API:", error);
        removeTyping(typingId);
        appendMessage('assistant', "Có lỗi từ máy chủ AI. Vui lòng thử lại sau.");
    } finally {
        sendBtn.disabled = false;
        inputField.focus();
    }
}

sendBtn.addEventListener('click', sendMessage);
inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// --- MENU DI ĐỘNG (MOBILE) CỦA GIAO DIỆN CŨ ---
const menuToggleBtn = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');

if (menuToggleBtn && mobileMenu) {
    menuToggleBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    document.querySelectorAll('#mobile-menu a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
        });
    });
}
})();
