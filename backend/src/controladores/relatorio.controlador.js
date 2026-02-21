const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const PdfPrinter = require('pdfmake');
const path = require('path');
const prisma = new PrismaClient();

// Configuração de Fontes para o PDFMake
const fonts = {
    Roboto: {
        normal: path.join(__dirname, '../../assets/fonts/Roboto-Regular.ttf'),
        bold: path.join(__dirname, '../../assets/fonts/Roboto-Medium.ttf'),
        italics: path.join(__dirname, '../../assets/fonts/Roboto-Italic.ttf'),
        bolditalics: path.join(__dirname, '../../assets/fonts/Roboto-MediumItalic.ttf')
    }
};
// NOTA: Se não tiver as fontes baixadas, o pdfmake pode dar erro. 
// Para simplificar neste exemplo, vou usar a configuração padrão que não exige arquivos locais se usar o VFS (Virtual File System) no front, 
// mas no back precisa dos arquivos.
// SE PREFERIR SEM FONTES LOCAIS, PODEMOS USAR 'Courier' padrão do PDFKit, mas pdfmake é melhor para tabelas.
// Vou assumir que você baixará as fontes ou usará uma lib mais simples se der erro.
// ALTERNATIVA: Usar fontes padrão (Helvetica) não funciona nativamente no pdfmake server-side sem mapeamento.
// Vamos usar uma abordagem segura: Se der erro de fonte, avise.

// --- HELPER PARA BUSCAR DADOS (Reutilizável) ---
const buscarDadosRelatorio = async (req) => {
    const { status, cargo, contaId, dataInicio, dataFim } = req.query;

    let whereClause = { contaId: req.usuario.contaId };
    if (req.usuario.tipo === 'OWNER' && contaId) whereClause.contaId = contaId;
    if (status && status !== 'todos') whereClause.status = status;
    if (cargo && cargo !== 'todos') whereClause.tipo = cargo;

    let dateFilter = {};
    if (dataInicio && dataFim) {
        dateFilter = {
            criadaEm: {
                gte: new Date(dataInicio + 'T00:00:00.000Z'),
                lte: new Date(dataFim + 'T23:59:59.999Z')
            }
        };
    }

    const usuarios = await prisma.usuario.findMany({
        where: whereClause,
        include: {
            _count: {
                select: { 
                    conversasResponsavel: { where: { ...dateFilter, statusConversa: { notIn: ['FINALIZADA', 'ARQUIVADA'] } } },
                    mensagensEnviadas: { where: { ...dateFilter } }
                }
            }
        },
        orderBy: { nome: 'asc' }
    });

    return usuarios;
};

// 1. EXPORTAR EXCEL
const exportarRelatorioEquipe = async (req, res) => {
    try {
        const usuarios = await buscarDadosRelatorio(req);
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Relatório');

        worksheet.columns = [
            { header: 'Nome', key: 'nome', width: 30 },
            { header: 'Cargo', key: 'cargo', width: 20 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Chats', key: 'chats', width: 10 },
            { header: 'Msgs', key: 'msgs', width: 10 },
            { header: 'Último Acesso', key: 'acesso', width: 25 },
        ];

        // Estilo
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };

        usuarios.forEach(u => {
            worksheet.addRow({
                nome: u.nome,
                cargo: u.tipo,
                status: u.status,
                chats: u._count.conversasResponsavel,
                msgs: u._count.mensagensEnviadas,
                acesso: u.ultimoAcesso ? new Date(u.ultimoAcesso).toLocaleString('pt-BR') : '-'
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=relatorio.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao gerar Excel');
    }
};

// 2. EXPORTAR PDF
const exportarRelatorioEquipePDF = async (req, res) => {
    try {
        const usuarios = await buscarDadosRelatorio(req);

        // Definição do documento PDFMake
        const docDefinition = {
            content: [
                { text: 'Relatório de Acompanhamento de Equipe', style: 'header' },
                { text: `Gerado em: ${new Date().toLocaleString('pt-BR')}`, style: 'subheader' },
                { text: `Filtros: ${req.query.status || 'Todos'} | ${req.query.cargo || 'Todos'}`, style: 'small' },
                { text: ' ', margin: [0, 10] }, // Espaço
                {
                    layout: 'lightHorizontalLines', // Layout da tabela
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
                        body: [
                            [
                                { text: 'Nome', style: 'tableHeader' }, 
                                { text: 'Cargo', style: 'tableHeader' }, 
                                { text: 'Status', style: 'tableHeader' },
                                { text: 'Chats', style: 'tableHeader' },
                                { text: 'Msgs', style: 'tableHeader' },
                                { text: 'Último Acesso', style: 'tableHeader' }
                            ],
                            ...usuarios.map(u => [
                                u.nome,
                                { text: u.tipo, style: 'cell' },
                                { text: u.status, color: u.status === 'ATIVO' ? 'green' : 'red', bold: true },
                                { text: u._count.conversasResponsavel.toString(), alignment: 'center' },
                                { text: u._count.mensagensEnviadas.toString(), alignment: 'center' },
                                { text: u.ultimoAcesso ? new Date(u.ultimoAcesso).toLocaleDateString('pt-BR') : '-', style: 'small' }
                            ])
                        ]
                    }
                }
            ],
            styles: {
                header: { fontSize: 18, bold: true, margin: [0, 0, 0, 5] },
                subheader: { fontSize: 10, color: 'gray', margin: [0, 0, 0, 5] },
                small: { fontSize: 8, color: 'gray' },
                tableHeader: { bold: true, fontSize: 10, color: 'black', fillColor: '#eeeeee' },
                cell: { fontSize: 9 }
            },
            defaultStyle: {
                // Se não configurar fontes locais, o pdfmake pode falhar no backend.
                // Como fallback seguro sem configurar assets, o ideal seria usar HTML-PDF ou PDFKit simples.
                // Mas vamos tentar usar a fonte padrão Helvetica se o printer permitir (depende da lib).
                font: 'Helvetica' 
            }
        };

        // Instancia o Printer (Isso requer fontes definidas ou mock delas)
        // HACK PARA NÃO PRECISAR BAIXAR FONTES AGORA: Usar 'StandardFonts' do pdfmake não é direto no Node.
        // Vamos usar PDFKit diretamente se você não tiver as fontes Roboto baixadas.
        // --- MUDANÇA ESTRATÉGICA PARA PDFKIT (Mais seguro sem configurar arquivos) ---
        
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 30 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=relatorio.pdf');

        doc.pipe(res);

        // Cabeçalho
        doc.fontSize(18).text('Relatório de Equipe', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown();

        // Tabela Simples (PDFKit não tem tabelas nativas fáceis, vamos desenhar linhas)
        let y = doc.y;
        const colX = [30, 200, 300, 380, 430, 480]; // Posições X das colunas

        // Header da Tabela
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('Nome', colX[0], y);
        doc.text('Cargo', colX[1], y);
        doc.text('Status', colX[2], y);
        doc.text('Chats', colX[3], y);
        doc.text('Msgs', colX[4], y);
        doc.text('Acesso', colX[5], y);
        
        y += 15;
        doc.moveTo(30, y).lineTo(570, y).stroke(); // Linha divisória
        y += 10;

        // Dados
        doc.font('Helvetica').fontSize(9);
        usuarios.forEach(u => {
            if (y > 700) { // Nova página se encher
                doc.addPage();
                y = 30;
            }

            doc.text(u.nome.substring(0, 25), colX[0], y);
            doc.text(u.tipo, colX[1], y);
            doc.fillColor(u.status === 'ATIVO' ? 'green' : 'red').text(u.status, colX[2], y).fillColor('black');
            doc.text(u._count.conversasResponsavel.toString(), colX[3], y);
            doc.text(u._count.mensagensEnviadas.toString(), colX[4], y);
            doc.text(u.ultimoAcesso ? new Date(u.ultimoAcesso).toLocaleDateString() : '-', colX[5], y);

            y += 15;
        });

        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao gerar PDF');
    }
};

module.exports = { exportarRelatorioEquipe, exportarRelatorioEquipePDF };