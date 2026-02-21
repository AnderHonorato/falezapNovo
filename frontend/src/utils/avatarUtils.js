// frontend/src/utils/avatarUtils.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * ✅ Gera a URL completa do avatar
 * @param {string} avatarFilename - Nome do arquivo do avatar
 * @param {boolean} forceReload - Se true, adiciona timestamp para forçar reload
 * @returns {string|null} URL completa do avatar ou null se não houver
 */
export const getAvatarUrl = (avatarFilename, forceReload = false) => {
  if (!avatarFilename) {
    return null;
  }

  const url = `${API_URL}/uploads/avatars/${avatarFilename}`;
  
  // Se forceReload, adiciona timestamp como query string
  return forceReload ? `${url}?t=${Date.now()}` : url;
};

/**
 * ✅ Pré-carrega uma imagem para evitar flash de carregamento
 * @param {string} url - URL da imagem
 * @returns {Promise<string>} Promise que resolve quando a imagem carrega
 */
export const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('URL inválida'));
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      console.log('[preloadImage] ✅ Imagem carregada com sucesso');
      resolve(url);
    };
    
    img.onerror = (error) => {
      console.error('[preloadImage] ❌ Erro ao carregar imagem:', error);
      reject(error);
    };
    
    img.src = url;
  });
};

/**
 * ✅ Placeholder SVG inline para quando não há avatar
 * (Base64 de um SVG com ícone de usuário)
 */
export const AVATAR_PLACEHOLDER_SVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRTVFN0VCIi8+CjxwYXRoIGQ9Ik01MCA1MEMyNi4yNSA1MCA3LjUgNTMuNzUgNy41IDU4LjEyNVY3NS42MjVDNy41IDgxLjI1IDEyLjUgODUgMTguNzUgODVIODEuMjVDODcuNSA4NSA5Mi41IDgxLjI1IDkyLjUgNzUuNjI1VjU4LjEyNUM5Mi41IDUzLjc1IDczLjc1IDUwIDUwIDUwWiIgZmlsbD0iIzlDQTNBRiIvPgo8Y2lyY2xlIGN4PSI1MCIgY3k9IjMwIiByPSIxNSIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4=';