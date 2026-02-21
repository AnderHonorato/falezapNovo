const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verificarToken } = require('../middleware/autenticacao.middleware');
const { parseISO, differenceInMinutes, format, startOfDay, endOfDay, isValid } = require('date-fns');
const { chamarSpiderXDireto } = require('../servicos/ia.servico');


router.use(verificarToken);


// ✅ ROTA PRINCIPAL: DADOS GERAIS (KPIs + GRÁFICOS)
// Frontend chama: GET /analytics
router.get('/', async (req, res) => {
    const { contaId } = req.usuario;
    const { inicio, fim, usuarioId } = req.query;

    if (!inicio || !fim) {
        return res.status(400).json({ erro: 'Datas obrigatórias' });
    }

    try {
        // 1. Tratamento de Datas (Fundamental para pegar o dia completo)
        const startDate = startOfDay(parseISO(inicio));
        const endDate = endOfDay(parseISO(fim));

        if (!isValid(startDate) || !isValid(endDate)) {
            return res.status(400).json({ erro: 'Datas inválidas' });
        }

        const whereBase = { contaId, criadaEm: { gte: startDate, lte: endDate } };
        const whereMsgs = { contaId, criadaEm: { gte: startDate, lte: endDate } };

        // Filtro por usuário (Drill-down)
        if (usuarioId) {
            whereBase.usuarioResponsavelId = usuarioId;
            whereMsgs.usuarioId = usuarioId;
        }

        // --- CÁLCULO DE KPIS (Direto do Banco) ---

        // Total Conversas
        const totalConversas = await prisma.conversa.count({ where: whereBase });

        // Total Mensagens
        const totalMensagens = await prisma.mensagem.count({ where: whereMsgs });

        // Total Equipe (Conta todos da conta para bater com o Dashboard)
        const totalUsers = await prisma.usuario.count({ where: { contaId } });

        // Novos Contatos (CORRIGIDO: Filtra através da Instância)
        const novosContatos = await prisma.contatoWhatsApp.count({ 
            where: { 
                instancia: { contaId }, // A relação correta é através da instância
                criadoEm: { gte: startDate, lte: endDate } 
            } 
        });

        // TMA e TME (Média de tempo)
        const conversasFinalizadas = await prisma.conversa.findMany({
            where: { ...whereBase, statusConversa: 'FINALIZADA', finalizadaEm: { not: null } },
            select: { criadaEm: true, finalizadaEm: true, usuarioResponsavelId: true }
        });

        let somaMinutos = 0;
        let qtdFinalizadas = 0;
        const statsUsuario = {};

        conversasFinalizadas.forEach(c => {
            const inicioC = new Date(c.criadaEm);
            const fimC = new Date(c.finalizadaEm);
            
            if (isValid(inicioC) && isValid(fimC)) {
                const diff = differenceInMinutes(fimC, inicioC);
                // Filtra conversas irreais (> 24h ou negativas)
                if (diff >= 0 && diff < 1440) {
                    somaMinutos += diff;
                    qtdFinalizadas++;

                    // Ranking Stats
                    if (c.usuarioResponsavelId) {
                        if (!statsUsuario[c.usuarioResponsavelId]) statsUsuario[c.usuarioResponsavelId] = { count: 0, soma: 0 };
                        statsUsuario[c.usuarioResponsavelId].count++;
                        statsUsuario[c.usuarioResponsavelId].soma += diff;
                    }
                }
            }
        });

        const tmaGeral = qtdFinalizadas > 0 ? Math.round(somaMinutos / qtdFinalizadas) : 0;
        const tmeGeral = Math.round(tmaGeral * 0.15); // Estimativa 15% do TMA

        // --- GRÁFICOS ---

        // Volume por Dia (Linha)
        const msgsData = await prisma.mensagem.findMany({
            where: whereMsgs,
            select: { criadaEm: true, direcao: true, usuarioId: true }
        });

        const agrupamento = {};
        msgsData.forEach(m => {
            const dia = format(m.criadaEm, 'dd/MM');
            if (!agrupamento[dia]) agrupamento[dia] = { name: dia, enviadas: 0, recebidas: 0 };
            
            // Lógica melhorada usando 'direcao' ou presença de usuarioId
            const isEnviada = m.direcao === 'out' || !!m.usuarioId; 
            if (isEnviada) agrupamento[dia].enviadas++;
            else agrupamento[dia].recebidas++;
        });

        const mensagensPorDia = Object.values(agrupamento).sort((a,b) => {
            const [dA, mA] = a.name.split('/');
            const [dB, mB] = b.name.split('/');
            return mA - mB || dA - dB;
        });

        // Status (Pizza)
        const statusRaw = await prisma.conversa.groupBy({
            by: ['statusConversa'],
            where: whereBase,
            _count: { id: true }
        });
        const graficoPizza = statusRaw.map(s => ({ name: s.statusConversa, value: s._count.id }));

        // Ranking
        const usersIds = Object.keys(statsUsuario);
        const usersInfo = await prisma.usuario.findMany({
            where: { id: { in: usersIds } },
            select: { id: true, nome: true }
        });

        const ranking = usersInfo.map(u => ({
            id: u.id,
            nome: u.nome,
            atendimentos: statsUsuario[u.id].count,
            tma: Math.round(statsUsuario[u.id].soma / statsUsuario[u.id].count)
        })).sort((a,b) => b.atendimentos - a.atendimentos);

        res.json({
            sucesso: true,
            dados: {
                kpis: {
                    conversas: totalConversas,
                    totalMsgs: totalMensagens,
                    tma: tmaGeral,
                    tme: tmeGeral,
                    totalUsers,
                    novosContatos
                },
                mensagensPorDia,
                graficoPizza,
                ranking
            }
        });

    } catch (error) {
        console.error('Erro Analytics:', error);
        res.status(500).json({ erro: 'Erro ao buscar dados' });
    }
});

// ✅ ROTA: RESUMO IA
router.get('/resumo-ia', async (req, res) => {
    const { contaId } = req.usuario;
    const { inicio, fim, usuarioId } = req.query;

    try {
        const startDate = startOfDay(parseISO(inicio));
        const endDate = endOfDay(parseISO(fim));
        
        // Filtros básicos para contexto rápido
        const whereBase = { contaId, criadaEm: { gte: startDate, lte: endDate } };
        if(usuarioId) whereBase.usuarioResponsavelId = usuarioId;

        const totalConversas = await prisma.conversa.count({ where: whereBase });
        const totalMensagens = await prisma.mensagem.count({ where: { contaId, criadaEm: { gte: startDate, lte: endDate } } });
        
        const prompt = `Analise estes dados de atendimento (${format(startDate, 'dd/MM')} a ${format(endDate, 'dd/MM')}):
        - Conversas: ${totalConversas}
        - Mensagens: ${totalMensagens}
        
        Gere um resumo executivo muito breve (3 parágrafos curtos) em Markdown focando em volume e eficiência.`;
        
        const resposta = await chamarSpiderXDireto(prompt);
        res.json({ sucesso: true, resposta });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro IA' });
    }
});

module.exports = router;