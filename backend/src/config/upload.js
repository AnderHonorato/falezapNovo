// backend/src/config/upload.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Diretório de uploads
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const TEMP_DIR = path.join(UPLOAD_DIR, 'temp');
const MEDIA_DIR = path.join(UPLOAD_DIR, 'media');
const AVATARS_DIR = path.join(UPLOAD_DIR, 'avatars');

// Criar diretórios se não existirem
[UPLOAD_DIR, TEMP_DIR, MEDIA_DIR, AVATARS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuração do storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // ❌ Se estiver assim, está errado:
    // cb(null, path.join(UPLOAD_DIR, 'blog')); 
    
    // ✅ O CORRETO É ASSIM (para salvar em temp):
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    const hash = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${hash}${ext}`;
    cb(null, filename);
  }
});

// Filtro de tipos de arquivo
const fileFilter = (req, file, cb) => {
  // Tipos permitidos
  const allowedMimes = [
    // Imagens
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Vídeos
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/webm',
    // Áudios
    'audio/mpeg',
    'audio/mp3',
    'audio/ogg',
    'audio/wav',
    'audio/webm',
    // Documentos
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    // Compactados
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`), false);
  }
};

// Configuração do multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB
    files: 10 // Máximo 10 arquivos por vez
  }
});

// Função para mover arquivo do temp para media
const moverParaMedia = (tempPath, filename) => {
  const mediaPath = path.join(MEDIA_DIR, filename);
  fs.renameSync(tempPath, mediaPath);
  return mediaPath;
};

// Função para deletar arquivo
const deletarArquivo = (filepath) => {
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
};

// Função para obter tipo de mídia
const obterTipoMidia = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'IMAGEM';
  if (mimetype.startsWith('video/')) return 'VIDEO';
  if (mimetype.startsWith('audio/')) return 'AUDIO';
  return 'DOCUMENTO';
};

module.exports = {
  upload,
  UPLOAD_DIR,
  TEMP_DIR,
  MEDIA_DIR,
  moverParaMedia,
  deletarArquivo,
  obterTipoMidia
};