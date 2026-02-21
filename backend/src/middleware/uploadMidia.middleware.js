const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ AJUSTE 1: Mudei de 'temp' para 'blog' para as imagens ficarem permanentes
// Se você deixar em 'temp', scripts de limpeza podem apagar as fotos do blog depois
const uploadDir = path.join(__dirname, '../../uploads/temp');

// Garante que o diretório exista
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configura o armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // ✅ AJUSTE 2: Limpeza do nome do arquivo
    // Remove espaços e acentos para evitar erro 404 na hora de carregar a imagem
    const nomeLimpo = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${Date.now()}-${nomeLimpo}`);
  }
});

// ✅ SEU FILTRO DE MÍDIA (MANTIDO IGUAL)
const fileFilter = (req, file, cb) => {
  const mtype = file.mimetype;
  
  if (
    mtype.startsWith('image/') ||
    mtype.startsWith('video/') ||
    mtype.startsWith('audio/') ||
    mtype === 'application/pdf' ||
    mtype === 'application/zip' ||
    mtype === 'application/msword' || 
    mtype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
    mtype === 'application/vnd.ms-excel' || 
    mtype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
    mtype === 'text/plain' 
  ) {
    cb(null, true); 
  } else {
    cb(new Error('Formato de arquivo não suportado (mídia).'), false); 
  }
};

const uploadMidia = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 16 * 1024 * 1024 } // 16MB
});

module.exports = uploadMidia;