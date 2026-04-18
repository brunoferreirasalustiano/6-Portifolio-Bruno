document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.form-grid');
    const btn = document.querySelector('#sbtn');
    const msgArea = document.querySelector('#fmsg');
    const hireBtn = document.querySelector('.nav-cta');
    const nameInput = document.getElementById('fn');

    // Foco automático ao clicar em Hire Me
    if (hireBtn && nameInput) {
        hireBtn.addEventListener('click', (e) => {
            setTimeout(() => nameInput.focus(), 700);
        });
    }

    // Envio p/ Backend Próprio
if (form) {
    form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData);

    // 🛡️ 4. TIMEOUT: Configurando o limite de 8 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8000ms = 8s

    try {
        const response = await fetch('https://6-portifolio-bruno-production.up.railway.app/contact', {
            method: 'POST',
            signal: controller.signal, // Lincando o abort ao fetch
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        clearTimeout(timeoutId); // Limpa o cronômetro se der tudo certo

        if (response.ok) {
            msgArea.className = 'form-msg ok';
            msgArea.textContent = 'Mensagem enviada com sucesso! 🚀';
            form.reset();
        } else {
            const errorData = await response.json();
            msgArea.className = 'form-msg err';
            // Mensagem se for pego pelo Rate Limit (Erro 429)
            if (response.status === 429) {
                 msgArea.textContent = 'Muitas tentativas. Tente novamente em alguns minutos.';
            } else {
                 msgArea.textContent = `Erro: ${errorData.message || 'Falha no servidor'}`;
            }
        }
    } catch (error) {
        msgArea.className = 'form-msg err';
        // Se o erro for porque o tempo esgotou
        if (error.name === 'AbortError') {
            msgArea.textContent = 'O servidor demorou muito para responder. Tente novamente.';
        } else {
            msgArea.textContent = 'Erro de conexão com o servidor.';
        }
        console.error('Erro no fetch:', error);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Enviar mensagem';
    }
});
}
});