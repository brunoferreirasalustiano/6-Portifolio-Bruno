import dotenv from 'dotenv';
import express from 'express';
import { Resend } from 'resend';
import cors from 'cors';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit'; // 👈 IMPORTANDO O RATE LIMIT

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL!, 
    process.env.SUPABASE_KEY!
);

const app = express();

// 1. CORS RESTRITO: site pode chamar essa API
app.use(cors({
    origin: ['https://brunoferreirasalustiano.github.io'], // 👈 COLOQUE SEU DOMÍNIO AQUI
    methods: ['POST'], // Só precisamos do POST para o form
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// 2. RATE LIMITING: Máximo de 5 envios a cada 15 minutos por IP proteção contra spam
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Bloqueia após 5 requisições
    message: { message: "Muitas requisições. Tente novamente mais tarde." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Inicializa o Resend
const resend = new Resend(process.env.RESEND_API_KEY);

const contactSchema = z.object({
    nome: z.string().min(3, "Nome muito curto"),
    email: z.string().email("E-mail inválido"),
    mensagem: z.string().min(5, "Mensagem muito curta"),
    _gotcha: z.string().optional()
});

//3. SANITIZAÇÃO: Função para kill qualquer HTML injetado (Proteção contra XSS, mesmo que o Resend já escape, é bom garantir)
function escapeHtml(str: string) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}

app.get('/', (req, res) => {
    res.status(200).json({ message: "API ON! 🚀", status: "Running" });
});

// Aplicando o limiter SÓ na rota de contato para evitar bloqueios desnecessários em outras rotas (se existirem)
app.post('/contact', contactLimiter, async (req, res) => {
    try {
        const { nome, email, mensagem, _gotcha } = contactSchema.parse(req.body);

        if (_gotcha) {
            console.log("🚩 BOT DETECTADO E BLOQUEADO!");
            return res.status(200).json({ message: "Mensagem processada (sqn)" });
        }

        console.log(`📩 NOVO CONTATO: ${nome} <${email}>`);

        // Enviando o e-mail com os dados SANITIZADOS 
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'brunoferreirasalustiano@gmail.com', // meu email real
            subject: '🚀 Novo contato do Portfólio!',
            html: `
                <p><strong>Nome:</strong> ${escapeHtml(nome)}</p>
                <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
                <p><strong>Mensagem:</strong> ${escapeHtml(mensagem)}</p>
            `
        });

        if (emailError) throw new Error("Falha no Resend");

        // Salvando no Banco de Dados
        const { error: dbError } = await supabase
            .from('contatos')
            .insert([{ nome, email, mensagem }]);

        if (dbError) console.error("❌ Erro no Supabase:", dbError.message);
        
        return res.status(201).json({ message: "Mensagem recebida e salva com sucesso! 🚀" });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Dados inválidos", details: error.flatten().fieldErrors });
        }
        console.error("❌ Erro inesperado:", error);
        return res.status(500).json({ message: "Erro interno no servidor." });
    }
});

// Auto-Ping Redundante - estou usando o cron tambem 
const URL_DO_MEU_RENDER = "https://portifoliobrunosalustiano.onrender.com/";
setInterval(() => fetch(URL_DO_MEU_RENDER).catch(() => {}), 600000); 

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`--- BACKEND DO BRUNO RODANDO NA PORTA ${PORT} ---`);
});