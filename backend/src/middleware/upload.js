const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define o diretório de uploads relativo à raiz do projeto backend
const uploadDir = path.join(__dirname, '../../uploads/chat-interno'); // Subir dois níveis a partir de src/middleware

// Cria o diretório de uploads se ele não existir
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Diretório de upload criado em: ${uploadDir}`);
  }
} catch (error) {
  console.error(`Falha ao criar diretório de upload (${uploadDir}):`, error);
  // Considerar lançar um erro ou usar um diretório padrão?
}


// Configuração de armazenamento em disco
const storage = multer.diskStorage({
  // Define a pasta de destino para os arquivos
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Usa o diretório definido acima
  },
  // Define como o nome do arquivo será gerado
  filename: (req, file, cb) => {
    // Gera um nome único para evitar colisões
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Extrai a extensão original do arquivo
    const extension = path.extname(file.originalname);
    // Monta o nome final: fieldname-timestamp-random.extensao
    // Usar fieldname ajuda a identificar a origem (ex: 'arquivos-167...jpg')
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  }
});

// Filtro para validar os tipos de arquivo permitidos
const fileFilter = (req, file, cb) => {
  // Define os tipos MIME permitidos (mais seguro que extensões)
  const allowedMimeTypes = [
    // Imagens
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    // Vídeos
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', // Adicionado mov
    // Áudios
    'audio/mpeg', // mp3
    'audio/ogg', 'audio/wav', 'audio/aac',
    // Documentos
    'application/pdf',
    'application/msword', // doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.ms-excel', // xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.ms-powerpoint', // ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
    'text/plain', // txt
    // Compactados (opcional)
    'application/zip', 'application/vnd.rar', 'application/x-zip-compressed'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    // Aceita o arquivo
    cb(null, true);
  } else {
    // Rejeita o arquivo
    console.warn(`Upload rejeitado: Tipo de arquivo não permitido - ${file.mimetype} (${file.originalname})`);
    cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`), false); // Envia erro e rejeita
  }
};

// Cria a instância do multer com as configurações
const upload = multer({
  storage: storage, // Define onde e como salvar os arquivos
  limits: {
    fileSize: 50 * 1024 * 1024, // Limite de 50MB por arquivo
    files: 5 // Limite de 5 arquivos por requisição (se usar upload.array())
  },
  fileFilter: fileFilter // Define quais tipos de arquivo são aceitos
});

// Exporta o middleware configurado
module.exports = upload;
