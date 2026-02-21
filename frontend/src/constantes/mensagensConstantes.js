// frontend/src/constantes/mensagensConstantes.js - CONSTANTES COMPLETAS

// ============================================
// CORES DE ANOTAÇÃO
// ============================================
export const CORES_ANOTACAO = {
  amarelo: {
    bg: '#fef3c7',
    borda: '#fbbf24',
    texto: '#78350f'
  },
  verde: {
    bg: '#d1fae5',
    borda: '#10b981',
    texto: '#064e3b'
  },
  azul: {
    bg: '#dbeafe',
    borda: '#3b82f6',
    texto: '#1e3a8a'
  },
  rosa: {
    bg: '#fce7f3',
    borda: '#ec4899',
    texto: '#831843'
  },
  roxo: {
    bg: '#ede9fe',
    borda: '#8b5cf6',
    texto: '#4c1d95'
  },
  laranja: {
    bg: '#fed7aa',
    borda: '#f97316',
    texto: '#7c2d12'
  },
  apagada: {
    bg: '#f3f4f6',
    borda: '#9ca3af',
    texto: '#6b7280'
  }
};

// ============================================
// PADRÕES DE FUNDO
// ============================================
export const BACKGROUND_PATTERN = {
  claro: `
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(0, 0, 0, 0.02) 10px,
      rgba(0, 0, 0, 0.02) 20px
    )
  `,
  escuro: `
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(255, 255, 255, 0.02) 10px,
      rgba(255, 255, 255, 0.02) 20px
    )
  `
};

// ============================================
// TEXTOS E MENSAGENS
// ============================================
export const TEXTOS = {
  // Mensagens de estado
  carregando: 'Carregando...',
  carregandoMensagens: 'Carregando mensagens...',
  nenhumaMensagem: 'Nenhuma mensagem',
  inicieConversa: 'Inicie a conversa enviando uma mensagem',
  conversaFinalizada: 'Esta conversa foi finalizada',
  selecioneConversa: 'Selecione uma conversa',
  selecioneConversaDescricao: 'Escolha uma conversa da lista para começar',
  
  // Placeholders
  digiteMensagem: 'Digite uma mensagem...',
  pesquisarConversas: 'Pesquisar conversas...',
  pesquisarMensagens: 'Pesquisar mensagens...',
  escrevaAnotacao: 'Escreva sua anotação...',
  
  // Botões
  enviar: 'Enviar',
  cancelar: 'Cancelar',
  salvar: 'Salvar',
  deletar: 'Deletar',
  editar: 'Editar',
  fechar: 'Fechar',
  confirmar: 'Confirmar',
  
  // Status
  enviada: 'Enviada',
  entregue: 'Entregue',
  lida: 'Lida',
  pendente: 'Pendente',
  erro: 'Erro ao enviar',
  
  // Tipos de mensagem
  imagem: 'Imagem',
  video: 'Vídeo',
  audio: 'Áudio',
  documento: 'Documento',
  figurinha: 'Figurinha',
  localizacao: 'Localização',
  contato: 'Contato',
  
  // Anotações
  novaAnotacao: 'Nova anotação',
  editarAnotacao: 'Editar anotação',
  deletarAnotacao: 'Deletar anotação',
  confirmarDeletarAnotacao: 'Deseja realmente deletar esta anotação?',
  anotacaoSalva: 'Anotação salva com sucesso!',
  anotacaoDeletada: 'Anotação deletada com sucesso!',
  
  // Conversas
  fixarConversa: 'Fixar conversa',
  desafixarConversa: 'Desafixar conversa',
  arquivarConversa: 'Arquivar conversa',
  desarquivarConversa: 'Desarquivar conversa',
  finalizarConversa: 'Finalizar conversa',
  reabrirConversa: 'Reabrir conversa',
  deletarConversa: 'Deletar conversa',
  
  // Mensagens do sistema
  mensagemApagada: 'Mensagem apagada',
  mensagemEditada: 'Mensagem editada',
  mensagemEncaminhada: 'Mensagem encaminhada',
  
  // Erros
  erroCarregar: 'Erro ao carregar',
  erroEnviar: 'Erro ao enviar',
  erroSalvar: 'Erro ao salvar',
  erroDeletar: 'Erro ao deletar',
  erroConexao: 'Erro de conexão',
  
  // Confirmações
  confirmarAcao: 'Tem certeza que deseja realizar esta ação?',
  acaoIrreversivel: 'Esta ação não pode ser desfeita',
};

// ============================================
// PLACEHOLDERS
// ============================================
export const PLACEHOLDERS = {
  mensagem: 'Digite uma mensagem...',
  pesquisa: 'Pesquisar...',
  anotacao: 'Escreva sua anotação...',
  legenda: 'Adicionar legenda...',
};

// ============================================
// TEMAS
// ============================================
export const TEMAS = {
  claro: {
    bg: '#f2f2f7',
    sidebar: '#ffffff',
    hover: '#f5f5f5',
    input: '#ffffff',
    inputBg: '#f0f2f5',
    borda: '#e0e0e0',
    texto: '#1c1e21',
    textoSecundario: '#667781',
    textoTerciario: '#8696a0',
    balaoEnviada: '#dcf8c6',
    balaoRecebida: '#ffffff',
    verde: '#00a884',
    verdeHover: '#008f72',
    azulLeitura: '#03a9f4',
    avatar: '#ddd',
    avatarTexto: '#fff',
    amareloStar: '#f59e0b'
  },
  escuro: {
    bg: '#0b141a',
    sidebar: '#212932',
    hover: '#2a3942',
    input: '#2a3942',
    inputBg: '#2a3942',
    borda: '#30363d',
    texto: '#e9edef',
    textoSecundario: '#8696a0',
    textoTerciario: '#667781',
    balaoEnviada: '#056162',
    balaoRecebida: '#1c2730',
    verde: '#00a884',
    verdeHover: '#008f72',
    azulLeitura: '#03a9f4',
    avatar: '#3b4a54',
    avatarTexto: '#d1d7db',
    amareloStar: '#f59e0b'
  }
};

// ============================================
// CONFIGURAÇÕES PADRÃO
// ============================================
export const CONFIG_PADRAO = {
  // Sidebar
  larguraSidebarMin: 280,
  larguraSidebarMax: 500,
  larguraSidebarPadrao: 350,
  
  // Mensagens
  mensagensPorPagina: 50,
  intervaloAtualizacao: 3000, // 3 segundos
  
  // Arquivos
  tamanhoMaximoArquivo: 16 * 1024 * 1024, // 16MB
  tiposArquivosPermitidos: [
    'image/*',
    'video/*',
    'audio/*',
    'application/pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx',
    '.txt'
  ],
  
  // Notificações
  duracaoNotificacao: 5000, // 5 segundos
  
  // Auto-scroll
  distanciaAutoScroll: 100,
  
  // Pesquisa
  delayPesquisa: 300, // 300ms
  
  // Zoom
  zoomMin: 0.8,
  zoomMax: 1.2,
  zoomPasso: 0.1,
  zoomPadrao: 1.0
};

// ============================================
// STATUS DE MENSAGEM
// ============================================
export const STATUS_MENSAGEM = {
  PENDENTE: 'PENDING',
  ENVIADA: 'SENT',
  ENTREGUE: 'DELIVERED',
  LIDA: 'READ',
  ERRO: 'FAILED'
};

// ============================================
// TIPOS DE MENSAGEM
// ============================================
export const TIPOS_MENSAGEM = {
  TEXTO: 'texto',
  IMAGEM: 'imagem',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENTO: 'documento',
  FIGURINHA: 'figurinha',
  LOCALIZACAO: 'localizacao',
  CONTATO: 'contato',
  SISTEMA: 'sistema',
  ANOTACAO: 'anotacao',
  REACAO: 'reacao',
  EVENTO: 'evento',
  DESCONHECIDO: 'desconhecido'
};

// ============================================
// STATUS DE CONVERSA
// ============================================
export const STATUS_CONVERSA = {
  CAIXA_ENTRADA: 'CAIXA_ENTRADA',
  ARQUIVADA: 'ARQUIVADA',
  FINALIZADA: 'FINALIZADA',
  TODAS: 'TODAS',
  FAVORITAS: 'FAVORITAS',
  NAO_LIDAS: 'NAO_LIDAS',
  GRUPOS: 'GRUPOS'
};

// ============================================
// EMOJIS E REAÇÕES
// ============================================
export const EMOJIS_RAPIDOS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '👏', '🔥'];

export const CATEGORIAS_EMOJI = {
  recentes: '🕐',
  smileys: '😊',
  pessoas: '👤',
  natureza: '🌿',
  comida: '🍕',
  atividades: '⚽',
  viagem: '✈️',
  objetos: '💡',
  simbolos: '❤️'
};

// ============================================
// ATALHOS DE TECLADO
// ============================================
export const ATALHOS_TECLADO = {
  ENVIAR: 'Enter',
  ENVIAR_COM_SHIFT: 'Shift+Enter',
  NEGRITO: 'Ctrl+B',
  ITALICO: 'Ctrl+I',
  PESQUISAR: 'Ctrl+F',
  FECHAR: 'Escape',
  ZOOM_IN: 'Ctrl+=',
  ZOOM_OUT: 'Ctrl+-',
  ZOOM_RESET: 'Ctrl+0'
};

// ============================================
// ANIMAÇÕES
// ============================================
export const DURACAO_ANIMACAO = {
  RAPIDA: 150,
  NORMAL: 300,
  LENTA: 500
};

// ============================================
// FORMATO DE DATA
// ============================================
export const FORMATO_DATA = {
  COMPLETA: 'dd/MM/yyyy HH:mm',
  DATA: 'dd/MM/yyyy',
  HORA: 'HH:mm',
  RELATIVA: 'relativa' // Hoje, Ontem, etc.
};

export default {
  CORES_ANOTACAO,
  BACKGROUND_PATTERN,
  TEXTOS,
  PLACEHOLDERS,
  TEMAS,
  CONFIG_PADRAO,
  STATUS_MENSAGEM,
  TIPOS_MENSAGEM,
  STATUS_CONVERSA,
  EMOJIS_RAPIDOS,
  CATEGORIAS_EMOJI,
  ATALHOS_TECLADO,
  DURACAO_ANIMACAO,
  FORMATO_DATA
};