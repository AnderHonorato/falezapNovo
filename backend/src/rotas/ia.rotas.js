const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verificarToken } = require('../middleware/autenticacao.middleware');
const { perguntarAoSistemaComRAG, chamarSpiderXDireto } = require('../servicos/ia.servico'); 

function generateContextualPrompt(prompt, historico, nomeUsuario, isNewChat) {
    let historyContext = '';
    const CONTEXT_WINDOW_SIZE = 2; 
    const recentMessages = historico.slice(-CONTEXT_WINDOW_SIZE);
    
    if (recentMessages.length > 0) {
        const contextLines = recentMessages.map(msg => {
            const role = msg.role === 'user' ? '👤 Usuário' : '🤖 Gemini';
            const text = msg.conteudo || '';
            return `${role}: ${text}`;
        }).join('\n');
        if (contextLines) historyContext = `\n--- HISTÓRICO RECENTE ---\n${contextLines}\n-------------------------\n`;
    }
    const userPrompt = prompt;
    let greeting = '';
    if (isNewChat) greeting = `Diga "Olá ${nomeUsuario}!" e se apresente como AlphaBot. Em mensagens subsequentes, continue a conversa normalmente e NUNCA se apresente novamente.`;
    
    const systemInstruction = `Você é a FaleZap IA, assistente virtual oficial da plataforma FaleZap.
REGRAS OBRIGATÓRIAS:
- Você NUNCA explica como o sistema funciona por dentro.
- Você NUNCA fala sobre backend, banco de dados, código, rotas, APIs, tokens ou estrutura interna.
- Você responde sempre como um produto voltado ao CLIENTE FINAL.
- Se o usuário perguntar algo interno ou técnico, responda educadamente que essa informação é interna do sistema.
SEU PAPEL: Ajudar o usuário a entender e usar as funcionalidades disponíveis da FaleZap.
MODOS DE ATENDIMENTO:
[FAQ] Explique de forma simples o que o usuário pode fazer na plataforma, quais funcionalidades estão disponíveis e como ele pode utilizá-las.
[SUPORTE] Ajude o usuário a resolver problemas comuns. Se identificar dificuldade técnica ou erro recorrente, oriente a abrir um chamado com o suporte humano.
[COMERCIAL] Explique benefícios da plataforma, vantagens, diferenciais e convide o usuário a falar com o time comercial.
COMPORTAMENTO: Seja educado, claro e direto. Não repita apresentações. Não invente funcionalidades. Se não souber, diga que não encontrou a informação. O usuário atual é ${nomeUsuario}. ${greeting}`;

    return `${systemInstruction}\n\n${historyContext}\n\nPERGUNTA DO USUÁRIO AGORA: "${userPrompt}"`;
}

// --- FUNÇÃO AUXILIAR INTELIGENTE (Aceita formato Novo e Antigo) ---
function resumirContextoAnalytics(contextoRaw) {
    try {
        let dados = typeof contextoRaw === 'string' ? JSON.parse(contextoRaw) : contextoRaw;
        if (!dados) return {};

        // Se o frontend já enviou os dados limpos (formato novo), usamos direto!
        if (dados.equipe_online || dados.ranking_resumo) {
            return dados;
        }

        // Caso contrário, fazemos a limpeza manual (Formato Antigo/Pesado)
        const kpisLimpos = dados.kpis || {};
        const breakdownsLimpos = {};
        
        if (dados.breakdowns) {
            breakdownsLimpos.conversas = dados.breakdowns.conversas; 
            breakdownsLimpos.mensagens = dados.breakdowns.mensagens; 
            
            // Tratamento da Equipe
            if (Array.isArray(dados.breakdowns.equipe)) {
                // Mapeia para uma lista de nomes simples
                breakdownsLimpos.equipe_online = dados.breakdowns.equipe.map(u => ({ 
                    nome: u.nome, 
                    status: u.status 
                }));
            }
        }

        let rankingLimpo = [];
        if (Array.isArray(dados.ranking_top5)) {
            rankingLimpo = dados.ranking_top5.slice(0, 5).map(u => ({
                nome: u.nome,
                atendimentos: u.atendimentos,
                tma: u.tma
            }));
        }

        let tagsLimpas = [];
        if (Array.isArray(dados.tags)) {
            tagsLimpas = dados.tags.map(t => `${t.name}: ${t.value}%`).join(', ');
        }

        return {
            periodo: dados.periodo || 'Atual',
            kpis: kpisLimpos,
            resumo_conversas: breakdownsLimpos.conversas, // Ajuste para ficar flat
            equipe_online: breakdownsLimpos.equipe_online, // Agora exposto no nível raiz ou onde preferir
            ranking_top_agentes: rankingLimpo,
            distribuicao_tags: tagsLimpas
        };

    } catch (e) {
        console.error("Erro ao resumir contexto:", e);
        return { erro: "Falha ao processar dados brutos" };
    }
}

// ... EM SEGUIDA VÊM AS SUAS ROTAS (router.post, router.get...)

router.post('/chat', verificarToken, async (req, res) => {
    const { contaId, id: usuarioId, nome: nomeUsuario } = req.usuario;
    try {
        const { prompt, conversaId } = req.body; 
        if (!prompt || typeof prompt !== 'string' || !prompt.trim()) return res.status(400).json({ erro: 'Prompt inválido.' });

        const promptSeguro = String(prompt);
        let conversa;
        let dbHistory = [];
        let isNewChat = true;
        let isConversaEncerrada = false;

        if (conversaId) {
            conversa = await prisma.conversaIA.findFirst({
                where: { id: conversaId, usuarioId },
                include: { mensagens: { where: { apagada: false }, orderBy: { criadaEm: 'asc' } } }
            });
            
            if (conversa) {
                dbHistory = conversa.mensagens;
                isNewChat = conversa.mensagens.length === 0;
                isConversaEncerrada = conversa.status === 'ENCERRADA'; 
            }
        }
        
        if (isConversaEncerrada) return res.status(400).json({ erro: 'Esta conversa foi encerrada. Inicie uma nova.' });
        
        if (!conversa) {
            conversa = await prisma.conversaIA.create({
                data: { contaId, usuarioId, nome: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''), status: 'ATIVA' }
            });
            isNewChat = true;
        }

        const promptLowerCase = promptSeguro.toLowerCase();
        const keywords = ['suporte', 'ajuda', 'atendente', 'falar com humano', 'abrir chamado', 'problema'];
        const isSupportRequest = keywords.some(k => promptLowerCase.includes(k));
        
        if (isSupportRequest) {
             await prisma.mensagemIA.create({
                 data: { conversaId: conversa.id, remetenteId: usuarioId, conteudo: prompt, role: 'user' }
             });
             
             const respostaTriagem = "Compreendo. Para direcionar você ao time certo, qual a categoria do seu chamado? Clique na opção desejada:";
             const msgIA = await prisma.mensagemIA.create({
                 data: {
                     conversaId: conversa.id,
                     conteudo: respostaTriagem,
                     role: 'model',
                     payload: {
                         acao: 'triagem_suporte',
                         tipos: [
                             { tipo: 'tecnico', nome: 'Técnico / Erro' },
                             { tipo: 'duvida', nome: 'Dúvidas' },
                             { tipo: 'acesso', nome: 'Acesso / Login' },
                             { tipo: 'sugestao', nome: 'Outros / Sugestão' }
                         ]
                     }
                 }
             });
             
             await prisma.conversaIA.update({ where: { id: conversa.id }, data: { atualizadoEm: new Date() } });

             return res.json({
                 sucesso: true,
                 resposta: msgIA.conteudo,
                 conversaId: conversa.id,
                 payload: msgIA.payload 
             });
        }

        const msgUsuario = await prisma.mensagemIA.create({
            data: { conversaId: conversa.id, remetenteId: usuarioId, conteudo: prompt, role: 'user' }
        });
        dbHistory.push({ role: msgUsuario.role, conteudo: msgUsuario.conteudo });

        const promptFinal = generateContextualPrompt(promptSeguro, dbHistory, nomeUsuario, isNewChat);

        if (promptFinal.length > 2048) {
            return res.status(400).json({ erro: 'Mensagem muito longa. Tente resumir a pergunta.' });
        }

        const resposta = await perguntarAoSistemaComRAG({
            perguntaUsuario: promptSeguro,
            nomeUsuario,
            modo: 'CONVERSA',
            primeiraMensagem: isNewChat
        });
        
        const feedback = resposta && resposta.trim() !== '' ? resposta : "Não consegui gerar uma resposta. Tente refazer a pergunta.";

        await prisma.mensagemIA.create({
            data: { conversaId: conversa.id, conteudo: feedback, role: 'model' }
        });
        
        await prisma.conversaIA.update({
            where: { id: conversa.id },
            data: { atualizadoEm: new Date() }
        });

        res.json({
            sucesso: true,
            resposta: feedback,
            conversaId: conversa.id, 
        });

    } catch (error) {
        console.error('Erro na Rota da IA (SpiderX):', error.message);
        res.status(500).json({ erro: `Falha na comunicação com a IA: ${error.message}` });
    }
});

router.post('/abrir-chamado-triado', verificarToken, async (req, res) => {
    const { contaId, id: usuarioId } = req.usuario;
    const { tipo, conversaId } = req.body;
    
    if (!tipo || !conversaId) {
        return res.status(400).json({ erro: 'Tipo de chamado e ID da conversa IA são obrigatórios.' });
    }
    
    try {
        const conversa = await prisma.conversaIA.findFirst({ 
            where: { id: conversaId, usuarioId },
            select: { id: true, usuarioId: true, status: true } 
        });

        if (!conversa) {
            return res.status(404).json({ erro: 'Conversa IA não encontrada.' });
        }
        
        const ultimoPrompt = await prisma.mensagemIA.findFirst({
            where: { conversaId, role: 'user' },
            orderBy: { criadaEm: 'desc' },
        });

        const protocolo = `AIA-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        const novaSolicitacao = await prisma.solicitacaoAjudaChatInterno.create({
            data: {
                contaId,
                solicitanteId: usuarioId,
                protocolo,
                tipo,
                descricao: `Chamado triado pela IA: Tipo: ${tipo}. Pergunta original: "${ultimoPrompt?.conteudo.substring(0, 200) || 'N/A'}"`,
                status: 'PENDENTE'
            },
            include: {
                solicitante: { select: { id: true, nome: true, foto_perfil: true } }
            }
        });
        
        await prisma.mensagemSuporte.create({
            data: {
                solicitacaoId: novaSolicitacao.id,
                remetenteId: usuarioId, 
                tipo: 'sistema',
                conteudo: `🚨 **Chamado nº ${protocolo}**\n\nAberto via **Assistente de IA** (Triagem: ${tipo}).`,
            }
        });
        
        await prisma.conversaIA.update({
             where: { id: conversaId }, 
             data: { status: 'ENCERRADA', encerradaEm: new Date() } 
        });
        
        res.json({
            sucesso: true,
            solicitacao: novaSolicitacao,
            conversaIAId: conversaId
        });

    } catch (error) {
        console.error('[IA] Erro ao abrir chamado triado:', error);
        res.status(500).json({ erro: 'Falha ao abrir chamado.' });
    }
});

// ✅ ROTA: Enviar aviso de inatividade
router.post('/aviso-inatividade', verificarToken, async (req, res) => {
    try {
        const { conversaId } = req.body;
        const { id: usuarioId } = req.usuario;
        
        const conversa = await prisma.conversaIA.findFirst({
            where: { id: conversaId, usuarioId }
        });
        
        if (!conversa) {
            return res.status(404).json({ erro: 'Conversa não encontrada' });
        }

        // Verifica se já enviou aviso recentemente para não duplicar
        const ultimoAviso = await prisma.mensagemIA.findFirst({
            where: { conversaId, role: 'system', conteudo: { contains: 'inatividade' } },
            orderBy: { criadaEm: 'desc' }
        });

        if (ultimoAviso && (new Date() - new Date(ultimoAviso.criadaEm) < 60000)) {
            return res.json({ sucesso: true, info: 'Aviso já enviado recentemente' });
        }
        
        const mensagemAviso = await prisma.mensagemIA.create({
            data: {
                conversaId,
                remetenteId: null,
                conteudo: '🕐 **Atenção:** Você ainda está aí? Para economizar recursos, encerrarei esta conversa em **2 minutos** caso não haja interação.',
                role: 'system'
            }
        });
        
        res.json({ 
            sucesso: true, 
            mensagem: {
                id: mensagemAviso.id,
                remetenteId: 'IA_GEMINI',
                conteudo: mensagemAviso.conteudo,
                criadaEm: mensagemAviso.criadaEm.toISOString(),
                tipo: 'sistema'
            }
        });
        
    } catch (erro) {
        console.error('[IA] Erro aviso inatividade:', erro);
        res.status(500).json({ erro: 'Erro ao enviar aviso de inatividade' });
    }
});

// ✅ ROTA: Encerrar conversa
router.post('/encerrar-conversa/:conversaId', verificarToken, async (req, res) => {
    const { conversaId } = req.params;
    const { id: usuarioId } = req.usuario;
    const { motivo } = req.body; // Aceita motivo opcional
    
    try {
        const conversa = await prisma.conversaIA.findFirst({
            where: { id: conversaId, usuarioId }
        });
        
        if (!conversa) return res.status(404).json({ erro: 'Conversa não encontrada.' });
        if (conversa.status === 'ENCERRADA') return res.status(400).json({ erro: 'Conversa já foi encerrada.' });
        
        // Mensagem de encerramento
        const msgTexto = motivo === 'inatividade' 
            ? "💤 **Conversa Encerrada por Inatividade**\n\nComo não houve interação recente, encerrei este chat. Se precisar de mais ajuda, inicie uma nova conversa!"
            : "📋 Esta conversa foi encerrada. Obrigado por usar nosso assistente!";

        await prisma.mensagemIA.create({
            data: { conversaId, remetenteId: null, conteudo: msgTexto, role: 'system' }
        });
        
        const msgAvaliacao = await prisma.mensagemIA.create({
            data: {
                conversaId,
                remetenteId: null,
                conteudo: "⭐ Por favor, avalie sua experiência com o assistente clicando nas estrelas abaixo.",
                role: 'model',
                payload: { acao: 'solicitar_avaliacao' }
            }
        });
        
        await prisma.conversaIA.update({
            where: { id: conversaId },
            data: { status: 'ENCERRADA', encerradaEm: new Date(), avaliacao: null, comentarioAvaliacao: null }
        });
        
        res.json({ 
            sucesso: true, 
            mensagemAvaliacao: {
                id: msgAvaliacao.id, 
                remetenteId: 'IA_GEMINI', 
                conteudo: msgAvaliacao.conteudo, 
                criadaEm: msgAvaliacao.criadaEm.toISOString(), 
                payload: msgAvaliacao.payload,
                conversaId: conversaId
            }
        });
        
    } catch (error) {
        console.error('[IA] Erro ao encerrar:', error);
        res.status(500).json({ erro: 'Falha ao encerrar conversa.' });
    }
});

// ROTA ATUALIZADA: Avaliar e Analisar Sentimento Automaticamente
router.post('/avaliar-conversa/:conversaId', verificarToken, async (req, res) => {
    const { conversaId } = req.params;
    const { avaliacao, comentario, dispositivo } = req.body;
    const { id: usuarioId } = req.usuario;
    
    try {
        const { analisarFeedbackIA } = require('../servicos/ia.servico');
        const analise = await analisarFeedbackIA(comentario, avaliacao);

        const atualizada = await prisma.conversaIA.update({
            where: { id: conversaId },
            data: { 
                avaliacao: parseInt(avaliacao), 
                comentarioAvaliacao: comentario || null,
                sentimento: analise.sentimento,
                tags: analise.tags,
                dispositivo: dispositivo || 'Desktop'
            }
        });

        res.json({ sucesso: true, conversa: atualizada });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// ROTA: Gerar Resumo de Inteligência (Resumo Semanal)
router.get('/relatorio-ia-executivo', verificarToken, async (req, res) => {
    try {
        const { gerarResumoExecutivoIA } = require('../servicos/ia.servico');
        const seteDiasAtras = new Date();
        seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

        const avaliacoes = await prisma.conversaIA.findMany({
            where: { avaliacao: { not: null }, atualizadoEm: { gte: seteDiasAtras } }
        });

        const resumo = await gerarResumoExecutivoIA(avaliacoes);
        res.json({ sucesso: true, resumo });
    } catch (error) {
        res.status(500).json({ erro: 'Falha ao gerar resumo' });
    }
});

// ROTA: Sugerir Resposta Empática para Feedback Negativo
router.post('/sugerir-resposta-feedback', verificarToken, async (req, res) => {
    const { comentario } = req.body;
    const prompt = `Crie uma resposta curta e muito empática para um cliente que reclamou: "${comentario}". Assine como Equipe FaleZap.`;
    
    try {
        const resposta = await chamarSpiderXDireto(prompt);
        res.json({ sucesso: true, sugestao: resposta });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao sugerir resposta' });
    }
});

// ROTA: Alterar Status de Tratativa (Feedback Loop)
router.patch('/status-tratativa/:id', verificarToken, async (req, res) => {
    const { statusTratativa } = req.body;
    try {
        await prisma.conversaIA.update({
            where: { id: req.params.id },
            data: { statusTratativa }
        });
        res.json({ sucesso: true });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao atualizar status' });
    }
});

// ✅ ROTA: Listar todas as avaliações (Dashboard de Aprendizado)
    router.get('/avaliacoes-geral', verificarToken, async (req, res) => {
    const { tipo } = req.usuario;

    // 🔒 Verificação de Segurança Rigorosa
    const CARGOS_PERMITIDOS = ['OWNER', 'CEO', 'SUPORTE'];
    if (!CARGOS_PERMITIDOS.includes(tipo)) {
        return res.status(403).json({ erro: 'Acesso negado. Apenas gestão pode acessar.' });
    }

    try {
        const avaliacoes = await prisma.conversaIA.findMany({
            where: {
                avaliacao: { not: null } // Apenas conversas avaliadas
            },
            include: {
                usuario: { // Quem avaliou
                    select: { id: true, nome: true, email: true, foto_perfil: true }
                },
                mensagens: { // Histórico completo para análise
                    where: { apagada: false },
                    orderBy: { criadaEm: 'asc' }
                }
            },
            orderBy: { atualizadoEm: 'desc' } // Mais recentes primeiro
        });

        res.json({ sucesso: true, avaliacoes });
    } catch (error) {
        console.error('Erro ao buscar avaliações:', error);
        res.status(500).json({ erro: 'Erro ao carregar dados de aprendizado.' });
    }
});

// ✅ ROTA ANALISTA: PROMPT RESTAURADO E COMPACTADO PARA EVITAR ERRO 400
router.post('/analise-dashboard', verificarToken, async (req, res) => {
    try {
        const { contexto, pergunta, historico } = req.body;
        
        // 1. BUSCA DADOS REAIS - Ordenados pelo mais recente
        const avaliacoesReais = await prisma.conversaIA.findMany({
            where: { avaliacao: { not: null } },
            take: 15, // Pegamos os 15 mais recentes para garantir espaço no prompt
            orderBy: { atualizadoEm: 'desc' },
            include: { 
                usuario: { select: { nome: true } } 
            }
        });

        // 2. PROCESSAMENTO DE DADOS (Dando prioridade ao conteúdo dos comentários)
        const agrupamento = {};
        const ultimosComentarios = [];

        avaliacoesReais.forEach((a, index) => {
            const nome = a.usuario.nome || "Anônimo";
            const dataHora = a.atualizadoEm.toLocaleString('pt-BR');
            
            // Métricas resumidas
            if (!agrupamento[nome]) agrupamento[nome] = { qtd: 0, soma: 0 };
            agrupamento[nome].qtd += 1;
            agrupamento[nome].soma += a.avaliacao;

            // Lista de comentários (limitamos a 7 para economizar caracteres)
            if (index < 7) {
                const txt = a.comentarioAvaliacao || 'Sem comentário';
                // Corta comentários longos para 70 caracteres
                const txtCurto = txt.length > 70 ? txt.substring(0, 70) + "..." : txt;
                ultimosComentarios.push(`- [${dataHora}] ${nome}: ${a.avaliacao}⭐ "${txtCurto}"`);
            }
        });

        const metricasTexto = Object.keys(agrupamento)
            .map(n => `${n}: ${agrupamento[n].qtd} avl (Média ${(agrupamento[n].soma/agrupamento[n].qtd).toFixed(1)})`)
            .join(' | ');

        // 3. RECONSTRUÇÃO DO PROMPT (Instruções de Personalidade + Dados)
        // Mantemos o "coração" do prompt para ela saber quem é e o que fazer
        const systemPrompt = `
    Atue como Analyzr IA, analista carismática do FaleZap. Seu papel é interpretar métricas de avaliações de usuários e fornecer insights acionáveis para melhorar a experiência do cliente. (falar somente se perguntado)
DADOS ATUAIS:
Métricas: ${metricasTexto}
Comentários Recentes (O primeiro é o mais atual):
${ultimosComentarios.join('\n')}

INSTRUÇÕES:
- Identifique o comentário mais recente pela data/hora.
- Use negrito para nomes.
- Seja direta e analítica.
- emojis são permitidos para humanizar.


Pergunta: "${pergunta}"
`.trim();

        // 4. VALIDAÇÃO DE TAMANHO ANTES DE ENVIAR (SEGURANÇA CONTRA ERRO 400)
        const promptFinal = systemPrompt.length > 2000 ? systemPrompt.substring(0, 2000) : systemPrompt;

        const resposta = await chamarSpiderXDireto(promptFinal);
        res.json({ sucesso: true, resposta });

    } catch (error) {
        console.error('Erro Analista:', error.message);
        res.status(500).json({ erro: 'Falha ao processar análise. Tente simplificar a pergunta.' });
    }
});

// ✅ ROTA CORRIGIDA (ia.rotas.js)
router.post('/analise-analytics', verificarToken, async (req, res) => {
    try {
        const { contexto, pergunta, historico } = req.body;
        
        // 1. Processa o contexto
        const dadosResumidos = resumirContextoAnalytics(contexto);
        const contextoString = JSON.stringify(dadosResumidos, null, 2);

        // 2. Monta o Prompt com a REGRA DE NÃO REPETIÇÃO
        const systemPrompt = `
        Você é o "Insighta IA", analista de performance da FaleZap.
        
        DADOS DE EQUIPE E OPERAÇÃO (JSON):
        ${contextoString}
        
        REGRAS DE COMPORTAMENTO (OBRIGATÓRIO):
        - NÃO SE APRESENTE NOVAMENTE. O usuário já sabe quem você é.
        - NÃO inicie com "Olá", "Sou o Data Insight" ou saudações repetitivas.
        - Vá direto para a resposta ou análise.
        - Se a lista 'equipe_online' estiver vazia, diga que ninguém está online no momento.
        - Se houver nomes em 'equipe_online', LISTE-OS quando perguntado "quem está online".
        - Analise os números de 'kpis' e 'ranking'.
        - Responda de forma carismática e profissional.
        - Use emojis coerentes caso faça sentido.
        
        PERGUNTA DO USUÁRIO: "${pergunta}"
        `.trim();

        // 3. Trava de segurança de tamanho
        const promptFinal = systemPrompt.length > 3500 ? systemPrompt.substring(0, 3500) : systemPrompt;
        
        const resposta = await chamarSpiderXDireto(promptFinal);
        
        res.json({ sucesso: true, resposta });

    } catch (error) {
        console.error('Erro Analista Analytics:', error.message);
        res.status(500).json({ erro: 'Falha ao processar análise.' });
    }
});

router.get('/conversas-ia', verificarToken, async (req, res) => {
    try {
        const { id: usuarioId } = req.usuario;
        const conversas = await prisma.conversaIA.findMany({
            where: { usuarioId },
            orderBy: { atualizadoEm: 'desc' }, 
            include: {
                mensagens: {
                    where: { apagada: false }, 
                    take: 1, 
                    orderBy: { criadaEm: 'desc' },
                    select: { conteudo: true, remetenteId: true, criadaEm: true }
                }
            }
        });

        const conversasFormatadas = conversas.map(c => {
             const ultimaMensagem = c.mensagens[0];
             const historico = ultimaMensagem ? [{
                id: `db-${ultimaMensagem.criadaEm.getTime()}`,
                remetenteId: ultimaMensagem.remetenteId || 'IA_GEMINI',
                conteudo: ultimaMensagem.conteudo,
                criadaEm: ultimaMensagem.criadaEm.toISOString(),
            }] : [];

             return {
                id: c.id,
                tipo: 'ia',
                nome: c.nome,
                criadaEm: c.criadoEm.toISOString(),
                status: c.status || 'ATIVA', 
                avaliacao: c.avaliacao || 0,
                encerradaEm: c.encerradaEm,
                historico: historico,
            };
        });

        res.json({ sucesso: true, conversas: conversasFormatadas });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao carregar histórico da IA.' });
    }
});

router.get('/mensagens-ia/:conversaId', verificarToken, async (req, res) => {
    try {
        const { conversaId } = req.params;
        const { id: usuarioId } = req.usuario;
        
        const conversa = await prisma.conversaIA.findFirst({
            where: { id: conversaId, usuarioId },
            include: {
                mensagens: { where: { apagada: false }, orderBy: { criadaEm: 'asc' } }
            }
        });

        if (!conversa) return res.status(404).json({ erro: 'Conversa IA não encontrada.' });

        const mensagensFormatadas = conversa.mensagens.map(m => ({
            id: m.id,
            remetenteId: m.remetenteId || 'IA_GEMINI', 
            conteudo: m.conteudo,
            criadaEm: m.criadaEm.toISOString(),
            tipo: m.apagada ? 'sistema' : m.tipo, 
            payload: m.payload || undefined, 
            role: m.role,
            conversaId: m.conversaId // <--- ADICIONE ESTA LINHA IMPORTANTE
        }));

        res.json({ 
            sucesso: true, 
            mensagens: mensagensFormatadas, 
            status: conversa.status || 'ATIVA', 
            avaliacao: conversa.avaliacao || 0 
        });

    } catch (error) {
        res.status(500).json({ erro: 'Erro ao carregar mensagens da IA.' });
    }
});

router.delete('/conversas-ia/:conversaId', verificarToken, async (req, res) => {
    try {
        const { conversaId } = req.params;
        const { id: usuarioId } = req.usuario;
        
        const conversa = await prisma.conversaIA.findFirst({ where: { id: conversaId, usuarioId } });
        
        if (!conversa) {
            return res.status(403).json({ erro: 'Acesso negado ou conversa não encontrada.' });
        }
        
        await prisma.conversaIA.delete({ where: { id: conversaId } });
        res.json({ sucesso: true, mensagem: 'Conversa excluída com sucesso.' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao excluir conversa.' });
    }
});

router.delete('/mensagens-ia/:mensagemId', verificarToken, async (req, res) => {
    try {
        const { mensagemId } = req.params;
        const { id: usuarioId } = req.usuario;
        
        const mensagem = await prisma.mensagemIA.findUnique({
            where: { id: mensagemId },
            include: { conversa: { select: { usuarioId: true } } }
        });
        
        if (!mensagem || mensagem.conversa.usuarioId !== usuarioId) {
            return res.status(403).json({ erro: 'Acesso negado ou mensagem não encontrada.' });
        }
        
        await prisma.mensagemIA.update({
            where: { id: mensagemId },
            data: { apagada: true, conteudo: '[Mensagem excluída]' }
        });
        res.json({ sucesso: true, mensagem: 'Mensagem excluída com sucesso.' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao excluir mensagem.' });
    }
});

module.exports = router;