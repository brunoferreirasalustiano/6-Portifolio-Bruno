import dotenv from 'dotenv';
dotenv.config(); // O Node lê o arquivo .env aqui

import express from 'express';
import { Resend } from 'resend';
import cors from 'cors';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
dotenv.config();

// 2. CRIAR A VARIÁVEL SUPABASE '
const supabase = createClient(
    process.env.SUPABASE_URL!, 
    process.env.SUPABASE_KEY!
);
const app = express();

// Configuração do CORS
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Inicializa o Resend com a chave .env
const resend = new Resend(process.env.RESEND_API_KEY);

const contactSchema = z.object({
    nome: z.string().min(3, "Nome muito curto"),
    email: z.string().email("E-mail inválido"),
    mensagem: z.string().min(5, "Mensagem muito curta"),
    _gotcha: z.string().optional()
});

app.get('/', (req, res) => {
    res.status(200).json({ 
        message: "API do Portfólio do Bruno está ON! 🚀",
        status: "Running"
    });
});

app.post('/contact', async (req, res) => {
    try {
        const { nome, email, mensagem, _gotcha } = contactSchema.parse(req.body);

        if (_gotcha) {
            console.log("🚩 BOT DETECTADO E BLOQUEADO!");
            return res.status(200).json({ message: "Mensagem processada (sqn)" });
        }

        console.log(`📩 NOVO CONTATO: ${nome} <${email}>`);

        // 1. Enviar E-mail via Resend
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'brunoferreirasalustiano@gmail.com',
            subject: '🚀 Novo contato do Portfólio!',
            html: `
                <p><strong>Nome:</strong> ${nome}</p>
                <p><strong>E-mail:</strong> ${email}</p>
                <p><strong>Mensagem:</strong> ${mensagem}</p>
            `
        });

        if (emailError) {
            console.error("❌ Erro no Resend:", emailError);
            return res.status(500).json({ message: "Falha ao enviar e-mail." });
        }

        // 2. Salvar no Banco de Dados
        const { error: dbError } = await supabase
            .from('contatos') // Nome da tabela que criei
            .insert([{ nome, email, mensagem }]);

        if (dbError) {
            console.error("❌ Erro ao salvar no Supabase:", dbError.message);
            // Mesmo se o banco falhar, o e-mail já foi enviado.
        } else {
            console.log("✅ Dados salvos no banco de dados com sucesso!");
        }
        
        return res.status(200).json({ 
            message: "Mensagem recebida, e-mail enviado e salva no banco! 🚀" 
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                message: "Dados inválidos", 
                details: error.flatten().fieldErrors 
            });
        }
        console.error("❌ Erro inesperado:", error);
        return res.status(500).json({ message: "Erro interno no servidor." });
    }
});

// Código para manter o Render acordado (Self-Ping)
const URL_DO_MEU_RENDER = "https://portifoliobrunosalustiano.onrender.com/";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`--- BACKEND DO BRUNO RODANDO ---`);
    console.log(`Link local: http://localhost:${PORT}`);
    
    // Inicia o auto-ping assim que o servidor subir
    setInterval(() => {
        fetch(URL_DO_MEU_RENDER)
            .then(() => console.log("⚓ Ping automático: Servidor mantido acordado!"))
            .catch((err) => console.error("❌ Erro no auto-ping:", err));
    }, 600000); // 10 minutos
});
