// backend/src/middleware/uploadAvatar.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ CORREÇÃO: Caminho para os avatares
const uploadDir = path.join(__dirname, '../../uploads/avatares');

// Cria o diretório se não existir
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Gera um nome único para o avatar, ligado ao ID do usuário
    const userId = req.usuario.id; // Pega o ID do usuário (do middleware verificarToken)
    const extension = path.extname(file.originalname);
    cb(null, `avatar-${userId}-${Date.now()}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Apenas imagens
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
  }
};

const uploadAvatar = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

module.exports = uploadAvatar; // Exporta apenas o uploader de avatar