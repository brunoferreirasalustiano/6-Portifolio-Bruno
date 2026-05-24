import dotenv from 'dotenv';
import express from 'express';
import { Resend } from 'resend';
import cors from 'cors';
import { z } from 'zod';
import rateLimit from 'express-rate-limit'; 
import mongoose from 'mongoose'; 

dotenv.config();

const app = express();
app.set('trust proxy', 1);

// Conexão com o MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI não definida!");
} else {
    if (mongoose.connection.readyState === 0) {
        mongoose.connect(MONGODB_URI)
            .then(() => console.log("💾 Conectado ao MongoDB Atlas"))
            .catch((err) => console.error("❌ Erro MongoDB:", err));
    }
}

// Schema e Modelo do Mongoose (Contrato de dados)
const ContactSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true },
    mensagem: { type: String, required: true },
    dataEnvio: { type: Date, default: Date.now }
});

const ContactModel = mongoose.models.Contato || mongoose.model('Contato', ContactSchema);

// Configuração do CORS
app.use(cors({
    origin: [
        'https://brunoferreirasalustiano.github.io', 
        'http://127.0.0.1:5500', 
        'http://localhost:5500'  
    ], 
    methods: ['POST', 'OPTIONS'], 
    allowedHeaders: ['Content-Type', 'Accept']
}));

app.use(express.json());

// Rate Limiting desconsiderando requisições OPTIONS
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5, 
    message: { message: "Muitas requisições. Tente novamente mais tarde." },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
});

const resend = new Resend(process.env.RESEND_API_KEY);

// BOA PRÁTICA: Schema do Zod centralizado fora da rota, tratando português e inglês de forma opcional
const contactSchema = z.object({
    nome: z.string().min(3, "Nome muito curto"),
    email: z.string().email("E-mail inválido"),
    mensagem: z.string().min(5, "Mensagem muito curta").optional(), 
    message: z.string().min(5, "Mensagem muito curta").optional(),  
    _gotcha: z.string().optional()
}).refine(data => data.mensagem || data.message, {
    message: "A mensagem é obrigatória",
    path: ["mensagem"]
});

function escapeHtml(str: string) {
    return str
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Rota Serverless para a Vercel
app.post('/api/contact', contactLimiter, async (req, res) => {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Passo 1: Executa o parse e já desestrutura as variáveis validadas
        const { nome, email, message, mensagem, _gotcha } = contactSchema.parse(req.body);
        
        // Passo 2: Define de forma segura qual campo de mensagem foi preenchido
        const textoMensagem = mensagem || message;

        if (!textoMensagem) {
            return res.status(400).json({ message: "O conteúdo da mensagem não pode estar vazio." });
        }

        // Passo 3: Proteção Honeypot contra Bots
        if (_gotcha) {
            console.log("🚩 BOT DETECTADO E BLOQUEADO!");
            return res.status(200).json({ message: "Mensagem processada com sucesso." });
        }

        // Passo 4: Envio do E-mail via Resend
        const { error: emailError } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'brunoferreirasalustiano@gmail.com', 
            subject: '🚀 Novo contato do Portfólio!',
            html: `
                <p><strong>Nome:</strong> ${escapeHtml(nome)}</p>
                <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
                <p><strong>Mensagem:</strong> ${escapeHtml(textoMensagem)}</p>
            `
        });

        if (emailError) throw new Error(`Falha no Resend: ${emailError.message}`);

        // Passo 5: Persistência no MongoDB Atlas
        try {
            await ContactModel.create({ nome, email, mensagem: textoMensagem });
        } catch (dbError: any) {
            throw new Error(`Falha no Banco: ${dbError.message}`);
        }
        
        return res.status(201).json({ message: "Mensagem recebida e salva com sucesso! 🚀" });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Dados inválidos", details: error.flatten().fieldErrors });
        }
        console.error("❌ Erro interno:", error.message || error);
        return res.status(500).json({ message: "Erro interno no servidor." });
    }
});

export default app;