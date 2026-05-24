import dotenv from 'dotenv';
import express from 'express';
import { Resend } from 'resend';
import cors from 'cors';
import { z } from 'zod';
import rateLimit from 'express-rate-limit'; 
import mongoose from 'mongoose'; // Substituído: @supabase/supabase-js por mongoose

dotenv.config();

const app = express();
app.set('trust proxy', 1);

// ==========================================
// CONFIGURAÇÃO E CONEXÃO DO BANCO DE DADOS
// ==========================================
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ Erro Crítico: MONGODB_URI não foi definida nas variáveis de ambiente!");
    process.exit(1);
}

// Conexão persistente com o MongoDB Atlas
mongoose.connect(MONGODB_URI)
    .then(() => console.log("💾 Conectado ao MongoDB Atlas com sucesso!"))
    .catch((err) => console.error("❌ Erro fatal ao conectar ao MongoDB:", err));

// Definição do Schema (Sustentação: Garante a estrutura do documento no banco)
const ContactSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true },
    mensagem: { type: String, required: true },
    dataEnvio: { type: Date, default: Date.now }
});

// Criação do Modelo para manipulação dos dados
const ContactModel = mongoose.model('Contato', ContactSchema);

// ==========================================
// MIDDLEWARES DE SEGURANÇA E PERFORMANCE
// ==========================================


// 1. CONFIGURAÇÃO AMPLIADA DO CORS (Boa prática para sustentação futura)
const allowedOrigins = [
    'https://brunoferreirasalustiano.github.io',
    'http://127.0.0.1:5500',
    'http://localhost:5500'
];

app.use(cors({
    origin: function (origin, callback) {
        // Permite requisições sem origem (como aplicativos mobile ou ferramentas de teste como Postman)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(` Tentativa de acesso bloqueada por CORS para a origem: ${origin}`);
            callback(new Error('Não permitido pela política de CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200 // Responde requisições prévias (preflight) com status 200 antigo
}));

app.use(express.json());

// 2. RATE LIMITING: Ajustado para ignorar requisições OPTIONS (Preflight)
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5, 
    message: { message: "Muitas requisições vindas deste IP. Tente novamente após 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false,
    // BOA PRÁTICA: Não contabiliza requisições OPTIONS no limite de tentativas do usuário
    skip: (req) => req.method === 'OPTIONS', 
});

// Inicialização do serviço de e-mail (Resend)
const resend = new Resend(process.env.RESEND_API_KEY);

// Schema de validação de dados de entrada com Zod
const contactSchema = z.object({
    nome: z.string().min(3, "Nome muito curto"),
    email: z.string().email("E-mail inválido"),
    mensagem: z.string().min(5, "Mensagem muito curta"),
    _gotcha: z.string().optional()
});

// 3. SANITIZAÇÃO: Prevenção contra injeção de scripts maliciosos (XSS)
function escapeHtml(str: string) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}

// ==========================================
// 🚀 ROTAS DA API
// ==========================================

app.get('/', (req, res) => {
    res.status(200).json({ message: "API ON! 🚀", status: "Running" });
});

app.post('/contact', contactLimiter, async (req, res) => {
    try {
        // Validação estrita do payload recebido do frontend
        const { nome, email, mensagem, _gotcha } = contactSchema.parse(req.body);

        // Honeypot: Se o campo oculto estiver preenchido, descarta silenciosamente (é um Bot)
        if (_gotcha) {
            console.log("🚩 BOT DETECTADO E BLOQUEADO PELO HONEYPOT!");
            return res.status(200).json({ message: "Mensagem processada com sucesso." });
        }

        console.log(`📩 Iniciando fluxo de contato para: ${nome} <${email}>`);

        // STEP 1: Disparo do e-mail transacional via Resend
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'brunoferreirasalustiano@gmail.com', 
            subject: '🚀 Novo contato do Portfólio!',
            html: `
                <p><strong>Nome:</strong> ${escapeHtml(nome)}</p>
                <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
                <p><strong>Mensagem:</strong> ${escapeHtml(mensagem)}</p>
            `
        });

        if (emailError) {
            console.error("❌ Erro disparado pelo Resend API:", emailError);
            throw new Error(`Falha no Resend: ${emailError.message || 'Erro desconhecido'}`);
        }

        // STEP 2: Persistência física dos dados no MongoDB Atlas
        try {
            await ContactModel.create({ nome, email, mensagem });
            console.log("💾 Registro inserido no MongoDB Atlas com sucesso!");
        } catch (dbError: any) {
            console.error("❌ Erro de persistência no MongoDB:", dbError.message);
            // Lança o erro para interromper o fluxo e evitar falso sucesso no frontend
            throw new Error(`Falha de gravação no banco: ${dbError.message}`);
        }
        
        // Resposta de sucesso definitiva para o cliente
        return res.status(201).json({ message: "Mensagem recebida e salva com sucesso! 🚀" });

    } catch (error: any) {
        // Tratamento específico para erros de validação de formulário (Zod)
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                message: "Dados inválidos", 
                details: error.flatten().fieldErrors 
            });
        }
        
        // Log centralizado para erros de infraestrutura capturados pelo throw (Resend / MongoDB)
        console.error("❌ Erro interceptado no fluxo de execução:", error.message || error);
        
        return res.status(500).json({ 
            message: "Erro interno no servidor ao processar sua mensagem." 
        });
    }
});

// Inicialização do processo do Express
const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando e escutando na porta ${PORT}`);
});

export default app;