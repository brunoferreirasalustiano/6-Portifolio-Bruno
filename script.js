// =========================================================================
// EVENTOS DE INTERAÇÃO DO USUÁRIO
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.form-grid');
    const btn = document.querySelector('#sbtn');
    const msgArea = document.querySelector('#fmsg');
    const hireBtn = document.querySelector('.nav-cta');
    const nameInput = document.getElementById('fn');

    // Foco automático no campo Nome ao clicar em "Hire Me"
    if (hireBtn && nameInput) {
        hireBtn.addEventListener('click', (e) => {
            setTimeout(() => nameInput.focus(), 700);
        });
    }

    // =========================================================================
    // ENVIO DO FORMULÁRIO PARA O BACKEND (VERCEL SERVERLESS)
    // =========================================================================
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Bloqueia o botão para evitar cliques duplos acidentais
            btn.disabled = true;
            btn.textContent = 'Enviando...';

            // Captura dinâmica dos dados do formulário baseada no atributo 'name' das tags HTML
            const formData = new FormData(form);
            const payload = Object.fromEntries(formData);

            // CONTROLADOR DE TIMEOUT: Cancela a requisição se o servidor demorar mais de 8 segundos
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); 

            try {
                const response = await fetch('https://6-portifolio-bruno.vercel.app/api/contact', {
                    method: 'POST',
                    signal: controller.signal, 
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                // Limpa o cronômetro do timeout se a resposta chegar a tempo
                clearTimeout(timeoutId); 

                // Tratamento da resposta do servidor
                if (response.ok) {
                    msgArea.className = 'form-msg ok';
                    msgArea.textContent = 'Mensagem enviada com sucesso! 🚀';
                    form.reset();
                } else {
                    const errorData = await response.json();
                    msgArea.className = 'form-msg err';
                    
                    // Tratamento específico para o limite de requisições (Rate Limit - Status 429)
                    if (response.status === 429) {
                         msgArea.textContent = 'Muitas tentativas. Tente novamente em alguns minutos.';
                    } else {
                         msgArea.textContent = `Erro: ${errorData.message || 'Falha no servidor'}`;
                    }
                }
            } catch (error) {
                msgArea.className = 'form-msg err';
                
                // Verifica se a requisição foi abortada pelo estouro de tempo (Timeout)
                if (error.name === 'AbortError') {
                    msgArea.textContent = 'O servidor demorou muito para responder. Tente novamente.';
                } else {
                    msgArea.textContent = 'Erro de conexão com o servidor.';
                }
                console.error('Erro detectado no fetch:', error);
            } finally {
                // Restaura o estado original do botão de envio, independente de sucesso ou erro
                btn.disabled = false;
                btn.textContent = 'Enviar mensagem';
            }
        });
    }
});