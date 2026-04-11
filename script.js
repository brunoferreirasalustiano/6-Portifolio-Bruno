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

    /// Envio para o seu Backend Próprio
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        btn.disabled = true;
        btn.textContent = 'Enviando...';
        
        // Transformando FormData em um Objeto JSON
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData);
        
        try {
            // Apontando para o Node.js local
            const response = await fetch('https://portifoliobrunosalustiano.onrender.com/contact', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json' 
                },
                body: JSON.stringify(payload) // O Node.js espera JSON
            });

            if (response.ok) {
                msgArea.className = 'form-msg ok';
                msgArea.textContent = 'Mensagem enviada pelo seu Backend! 🚀';
                form.reset(); 
            } else {
                const errorData = await response.json();
                msgArea.className = 'form-msg err';
                msgArea.textContent = `Erro: ${errorData.message || 'Falha no servidor'}`;
            }
        } catch (error) {
            msgArea.className = 'form-msg err';
            msgArea.textContent = 'Erro de conexão com o servidor local.';
            console.error('Erro no fetch:', error);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Enviar mensagem';
        }
    });
}
});