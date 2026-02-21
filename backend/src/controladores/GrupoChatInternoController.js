// backend/src/controladores/GrupoChatInternoController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// REMOVIDO: const { io } = require('../servidor'); (Causa erro de dependência circular)
const fs = require('fs');
const path = require('path');

// Função auxiliar para obter o IO com segurança
const getIo = (req) => {
    if (req.io) return req.io; // Se estiver no middleware
    try {
        return require('../servidor').io; // Tenta importar sob demanda
    } catch (e) {
        return null;
    }
};

class GrupoChatInternoController {

    // 🗂️ CRUD de Grupos

    criarGrupo = async (req, res) => {
        const io = getIo(req); // Obtém IO aqui

        try {
            const { contaId, id: criadorId } = req.usuario;
            const { nome, descricao, membros: membrosString } = req.body || {}; 
            
            let membros = [];

            if (membrosString) {
                try {
                    membros = typeof membrosString === 'string' 
                        ? JSON.parse(membrosString) 
                        : membrosString;
                        
                    if (!Array.isArray(membros)) {
                        return res.status(400).json({ erro: 'O campo membros deve ser um array de IDs.' });
                    }
                } catch (e) {
                    return res.status(400).json({ erro: 'Formato de membros inválido.' });
                }
            }
            
            if (!nome || nome.trim() === '') {
                return res.status(400).json({ erro: 'Nome do grupo é obrigatório.' });
            }
            
            if (!Array.isArray(membros) || membros.length === 0) {
                return res.status(400).json({ erro: 'Pelo menos um membro é obrigatório.' });
            }

            // Garante que o criador esteja na lista de membros 
            const membrosIds = [...new Set([...membros, criadorId])];

            // Processa imagem se houver upload
            const imagemUrl = req.file ? `/uploads/grupos/${req.file.filename}` : null;

            const novoGrupo = await prisma.grupoChatInterno.create({
                data: {
                    contaId,
                    criadorId,
                    nome,
                    descricao,
                    imagem: imagemUrl,
                    membros: {
                        create: membrosIds.map(id => ({ 
                            usuarioId: id,
                            isAdmin: id === criadorId 
                        }))
                    }
                },
                include: {
                    membros: {
                        include: {
                            usuario: {
                                select: { id: true, nome: true, email: true, foto_perfil: true, tipo: true }
                            }
                        }
                    },
                    criador: {
                        select: { id: true, nome: true, foto_perfil: true }
                    }
                }
            });

            // Notificação aos membros
            if (io) {
                membrosIds.forEach(id => {
                    io.to(`usuario_${id}`).emit('novo_grupo_chat_interno', novoGrupo);
                });
            }

            res.status(201).json({ grupo: novoGrupo });

        } catch (error) {
            console.error('Erro ao criar grupo:', error);
            res.status(500).json({ erro: 'Erro interno ao criar grupo.' });
        }
    }

    listarGrupos = async (req, res) => {
        try {
            const { contaId, id: usuarioId } = req.usuario;
            
            const grupos = await prisma.grupoChatInterno.findMany({
                where: {
                    contaId,
                    membros: { some: { usuarioId } }
                },
                include: {
                    membros: {
                        include: {
                            usuario: { select: { id: true, nome: true, foto_perfil: true, tipo: true } }
                        }
                    },
                    criador: { select: { id: true, nome: true } }
                },
                orderBy: { criadoEm: 'desc' }
            });

            const gruposComContagem = grupos.map(g => ({
                ...g,
                totalMembros: g.membros.length
            }));

            res.status(200).json({ grupos: gruposComContagem });

        } catch (error) {
            console.error('Erro ao listar grupos:', error);
            res.status(500).json({ erro: 'Erro interno ao listar grupos.' });
        }
    }

    buscarGrupo = async (req, res) => {
        try {
            const { id } = req.params;
            const { contaId, id: usuarioId } = req.usuario;

            const grupo = await prisma.grupoChatInterno.findFirst({
                where: {
                    id,
                    contaId,
                    membros: { some: { usuarioId } }
                },
                include: {
                    membros: {
                        include: {
                            usuario: { select: { id: true, nome: true, email: true, foto_perfil: true, tipo: true } }
                        }
                    },
                    criador: { select: { id: true, nome: true, email: true, foto_perfil: true } }
                }
            });

            if (!grupo) return res.status(404).json({ erro: 'Grupo não encontrado.' });

            res.status(200).json({ grupo });

        } catch (error) {
            console.error('Erro ao buscar grupo:', error);
            res.status(500).json({ erro: 'Erro interno ao buscar grupo.' });
        }
    }

    atualizarGrupo = async (req, res) => {
        const io = getIo(req); // ✅ IO obtido aqui

        try {
            const { id } = req.params;
            const { contaId, id: usuarioId } = req.usuario;
            const { nome, descricao, membros: membrosString } = req.body || {};
            let membros = [];

            // Verifica permissão (apenas Admin ou Criador)
            const grupoExistente = await prisma.grupoChatInterno.findFirst({
                where: {
                    id,
                    contaId,
                    OR: [
                        { criadorId: usuarioId },
                        { membros: { some: { usuarioId, isAdmin: true } } }
                    ]
                },
                include: { membros: true }
            });

            if (!grupoExistente) {
                return res.status(403).json({ erro: 'Você não tem permissão para editar este grupo.' });
            }

            // Processa membros
            if (membrosString) {
                try {
                    membros = typeof membrosString === 'string' ? JSON.parse(membrosString) : membrosString;
                } catch (e) {
                    return res.status(400).json({ erro: 'Formato de membros inválido.' });
                }
            }

            const dataAtualizacao = {};
            if (nome) dataAtualizacao.nome = nome;
            if (descricao !== undefined) dataAtualizacao.descricao = descricao;
            if (req.file) dataAtualizacao.imagem = `/uploads/grupos/${req.file.filename}`;

            // Atualiza dados básicos
            await prisma.grupoChatInterno.update({
                where: { id },
                data: dataAtualizacao
            });

            // Atualização de Membros
            if (membrosString !== undefined) { 
                const membrosIds = [...new Set([...membros, grupoExistente.criadorId])];
                const membrosAtuaisIds = grupoExistente.membros.map(m => m.usuarioId);
                
                const novos = membrosIds.filter(id => !membrosAtuaisIds.includes(id));
                const removidos = membrosAtuaisIds.filter(id => !membrosIds.includes(id) && id !== grupoExistente.criadorId);
                
                // Adiciona novos
                if (novos.length > 0) {
                    await prisma.membroGrupoChatInterno.createMany({
                        data: novos.map(membroId => ({
                            grupoId: id,
                            usuarioId: membroId,
                            isAdmin: false
                        })),
                        skipDuplicates: true
                    });
                    
                    // Notifica entrada
                    for (const novoMembroId of novos) {
                        const novoMembro = await prisma.usuario.findUnique({ where: { id: novoMembroId }, select: { nome: true } });
                        
                        await prisma.mensagemChatInterno.create({
                            data: {
                                contaId,
                                remetenteId: usuarioId,
                                grupoId: id,
                                conteudo: `${novoMembro.nome} entrou no grupo`,
                                tipo: 'sistema'
                            }
                        });
                        
                        if (io) { // ✅ Verificação de segurança
                            io.to(`grupo_${id}`).emit('membro_entrou_grupo', {
                                grupoId: id,
                                membro: { id: novoMembroId, nome: novoMembro.nome }
                            });
                        }
                    }
                }
                
                // Remove antigos
                if (removidos.length > 0) {
                    await prisma.membroGrupoChatInterno.deleteMany({
                        where: { grupoId: id, usuarioId: { in: removidos } }
                    });
                    
                    for (const membroRemovidoId of removidos) {
                        const membroRemovido = await prisma.usuario.findUnique({ where: { id: membroRemovidoId }, select: { nome: true } });
                        
                        await prisma.mensagemChatInterno.create({
                            data: {
                                contaId,
                                remetenteId: usuarioId,
                                grupoId: id,
                                conteudo: `${membroRemovido.nome} saiu do grupo`,
                                tipo: 'sistema'
                            }
                        });
                        
                        if (io) { // ✅ Verificação de segurança
                            io.to(`grupo_${id}`).emit('membro_saiu_grupo', { grupoId: id, usuarioId: membroRemovidoId });
                            io.to(`usuario_${membroRemovidoId}`).emit('grupo_excluido', { grupoId: id });
                        }
                    }
                }
            }

            // Busca grupo atualizado
            const grupoFinal = await prisma.grupoChatInterno.findUnique({
                where: { id },
                include: {
                    membros: {
                        include: {
                            usuario: { select: { id: true, nome: true, email: true, foto_perfil: true, tipo: true } }
                        }
                    },
                    criador: { select: { id: true, nome: true, foto_perfil: true } }
                }
            });

            if (io) { // ✅ Verificação de segurança
                grupoFinal.membros.forEach(membro => {
                    io.to(`usuario_${membro.usuarioId}`).emit('grupo_atualizado', grupoFinal);
                });
            }

            res.status(200).json({ grupo: grupoFinal });

        } catch (error) {
            console.error('Erro ao atualizar grupo:', error);
            res.status(500).json({ erro: 'Erro interno ao atualizar grupo.' });
        }
    }

    excluirGrupo = async (req, res) => {
        const io = getIo(req); // ✅ IO obtido aqui

        try {
            const { id } = req.params;
            const { contaId, id: usuarioId } = req.usuario;

            const grupo = await prisma.grupoChatInterno.findFirst({
                where: { id, contaId, criadorId: usuarioId },
                include: { membros: true }
            });

            if (!grupo) return res.status(403).json({ erro: 'Apenas o criador pode excluir o grupo.' });

            await prisma.grupoChatInterno.delete({ where: { id } });

            if (io) {
                grupo.membros.forEach(membro => {
                    io.to(`usuario_${membro.usuarioId}`).emit('grupo_excluido', { grupoId: id });
                });
            }

            res.status(200).json({ mensagem: 'Grupo excluído com sucesso.' });

        } catch (error) {
            console.error('Erro ao excluir grupo:', error);
            res.status(500).json({ erro: 'Erro interno ao excluir grupo.' });
        }
    }

    adicionarMembro = async (req, res) => {
        const io = getIo(req); // ✅ IO obtido aqui

        try {
            const { id: grupoId } = req.params;
            const { usuarioId: novoMembroId } = req.body;
            const { contaId, id: usuarioId } = req.usuario;

            // Verifica admin
            const membroAdmin = await prisma.membroGrupoChatInterno.findFirst({
                where: { grupoId, usuarioId, isAdmin: true }
            });

            if (!membroAdmin) return res.status(403).json({ erro: 'Apenas administradores podem adicionar membros.' });

            const jaExiste = await prisma.membroGrupoChatInterno.findFirst({
                where: { grupoId, usuarioId: novoMembroId }
            });

            if (jaExiste) return res.status(409).json({ erro: 'Este usuário já é membro do grupo.' });

            await prisma.membroGrupoChatInterno.create({
                data: { grupoId, usuarioId: novoMembroId, isAdmin: false }
            });

            const novoMembro = await prisma.usuario.findUnique({
                where: { id: novoMembroId },
                select: { nome: true, foto_perfil: true }
            });

            await prisma.mensagemChatInterno.create({
                data: {
                    contaId,
                    remetenteId: usuarioId,
                    grupoId,
                    conteudo: `${novoMembro.nome} entrou no grupo`,
                    tipo: 'sistema'
                }
            });

            if (io) {
                io.to(`grupo_${grupoId}`).emit('membro_entrou_grupo', {
                    grupoId,
                    membro: { id: novoMembroId, nome: novoMembro.nome, foto_perfil: novoMembro.foto_perfil }
                });
            }

            res.status(200).json({ sucesso: true });

        } catch (error) {
            console.error('Erro ao adicionar membro:', error);
            res.status(500).json({ erro: 'Erro interno ao adicionar membro.' });
        }
    }

    removerMembro = async (req, res) => {
        const io = getIo(req); // ✅ IO obtido aqui

        try {
            const { id: grupoId, usuarioId: membroId } = req.params;
            const { contaId, id: usuarioId } = req.usuario;

            const grupo = await prisma.grupoChatInterno.findUnique({
                where: { id: grupoId },
                select: { criadorId: true }
            });

            const membroAdmin = await prisma.membroGrupoChatInterno.findFirst({
                where: { grupoId, usuarioId, isAdmin: true }
            });

            // Permissão: Admin ou o próprio usuário saindo
            if (!membroAdmin && usuarioId !== membroId) {
                return res.status(403).json({ erro: 'Sem permissão para remover este membro.' });
            }

            if (membroId === grupo.criadorId) {
                return res.status(403).json({ erro: 'Não é possível remover o criador do grupo.' });
            }

            await prisma.membroGrupoChatInterno.deleteMany({
                where: { grupoId, usuarioId: membroId }
            });

            const membroRemovido = await prisma.usuario.findUnique({
                where: { id: membroId },
                select: { nome: true }
            });

            const msgSistema = await prisma.mensagemChatInterno.create({
                data: {
                    contaId,
                    remetenteId: usuarioId,
                    grupoId,
                    conteudo: `${membroRemovido.nome} saiu do grupo`,
                    tipo: 'sistema'
                }
            });

            if (io) {
                // Notifica o grupo para atualizar a lista de membros e o chat
                io.to(`grupo_${grupoId}`).emit('chat_interno_nova_mensagem', { 
                    mensagem: msgSistema, 
                    conversaInfo: { tipo: 'grupo', grupoId } 
                });

                io.to(`grupo_${grupoId}`).emit('membro_saiu_grupo', { grupoId, usuarioId: membroId });
                
                // Notifica o usuário removido para bloquear o chat
                io.to(`usuario_${membroId}`).emit('voce_saiu_grupo', { grupoId });
            }

            res.status(200).json({ sucesso: true });

        } catch (error) {
            console.error('Erro ao remover membro:', error);
            res.status(500).json({ erro: 'Erro interno ao remover membro.' });
        }
    }

    // ✅ NOVO MÉTODO: SAIR DO GRUPO (Separado para clareza e permissão específica)
    sairGrupo = async (req, res) => {
        const io = getIo(req);
        try {
            const { id: grupoId } = req.params;
            const { contaId, id: usuarioId } = req.usuario;

            const grupo = await prisma.grupoChatInterno.findUnique({ where: { id: grupoId } });
            
            if (!grupo) return res.status(404).json({ erro: 'Grupo não encontrado' });
            
            // Criador não pode sair (deve deletar o grupo ou transferir admin)
            if (grupo.criadorId === usuarioId) {
                return res.status(400).json({ erro: 'O criador não pode sair do grupo. Exclua o grupo ou transfira a propriedade.' });
            }

            // Remove o membro
            await prisma.membroGrupoChatInterno.deleteMany({
                where: { grupoId, usuarioId }
            });

            // Cria mensagem de sistema
            const usuarioSaiu = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { nome: true } });
            
            const msgSistema = await prisma.mensagemChatInterno.create({
                data: {
                    contaId,
                    remetenteId: usuarioId, // Quem saiu
                    grupoId,
                    conteudo: `${usuarioSaiu.nome} saiu do grupo`,
                    tipo: 'sistema'
                }
            });

            // Notifica o grupo e o usuário
            if (io) {
                io.to(`grupo_${grupoId}`).emit('chat_interno_nova_mensagem', { 
                    mensagem: msgSistema, 
                    conversaInfo: { tipo: 'grupo', grupoId } 
                });
                
                io.to(`grupo_${grupoId}`).emit('membro_saiu_grupo', { 
                    grupoId, 
                    usuarioId 
                });
                
                // Notifica especificamente quem saiu para atualizar a UI (bloquear chat)
                io.to(`usuario_${usuarioId}`).emit('voce_saiu_grupo', { grupoId });
            }

            res.status(200).json({ sucesso: true });
        } catch (error) {
            console.error('Erro ao sair do grupo:', error);
            res.status(500).json({ erro: 'Erro ao sair do grupo' });
        }
    }
}

module.exports = new GrupoChatInternoController();