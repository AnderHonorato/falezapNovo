// backend/src/middleware/uploadcontato.middleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define o diretório de uploads temporários
const tempDir = path.join(__dirname, '../../uploads/temp');

// Garante que o diretório exista
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Configura o armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Cria um nome de arquivo único
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Filtra para aceitar apenas arquivos .vcf
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/vcard' || file.mimetype === 'text/x-vcard' || path.extname(file.originalname).toLowerCase() === '.vcf') {
    cb(null, true);
  } else {
    cb(new Error('Formato de arquivo inválido, envie apenas .vcf'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Limite de 5MB
});

module.exports = upload;