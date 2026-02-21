// backend/src/servicos/midia.servico.js

const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { MEDIA_DIR } = require('../config/upload');

class MidiaServico {

  // ✅ BLOCO 3: Processar imagem (redimensionar e criar thumbnail)
  async processarImagem(caminhoOriginal, filename) {
    try {
      console.log('🖼️ Processando imagem:', filename);

      const caminhoProcessado = path.join(MEDIA_DIR, `processed-${filename}`);
      const caminhoThumb = path.join(MEDIA_DIR, `thumb-${filename}`);

      // Obter metadados da imagem
      const metadata = await sharp(caminhoOriginal).metadata();

      // Redimensionar imagem principal (máx 1920px)
      await sharp(caminhoOriginal)
        .resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 })
        .toFile(caminhoProcessado);

      // Criar thumbnail (300px)
      await sharp(caminhoOriginal)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 70 })
        .toFile(caminhoThumb);

      // Deletar original
      fs.unlinkSync(caminhoOriginal);

      return {
        caminhoProcessado,
        caminhoThumb,
        largura: metadata.width,
        altura: metadata.height,
        tamanho: fs.statSync(caminhoProcessado).size
      };

    } catch (error) {
      console.error('❌ Erro ao processar imagem:', error);
      throw error;
    }
  }

  // ✅ BLOCO 3: Processar vídeo (criar thumbnail e obter metadados)
  async processarVideo(caminhoOriginal, filename) {
    try {
      console.log('🎥 Processando vídeo:', filename);

      const caminhoThumb = path.join(MEDIA_DIR, `thumb-${filename}.jpg`);

      return new Promise((resolve, reject) => {
        // Obter metadados e criar thumbnail
        ffmpeg.ffprobe(caminhoOriginal, (err, metadata) => {
          if (err) {
            reject(err);
            return;
          }

          const videoStream = metadata.streams.find(s => s.codec_type === 'video');
          const duracao = Math.floor(metadata.format.duration);

          // Criar thumbnail no segundo 1
          ffmpeg(caminhoOriginal)
            .screenshots({
              timestamps: ['00:00:01'],
              filename: path.basename(caminhoThumb),
              folder: path.dirname(caminhoThumb),
              size: '300x300'
            })
            .on('end', () => {
              resolve({
                caminhoThumb,
                largura: videoStream?.width,
                altura: videoStream?.height,
                duracao: duracao,
                tamanho: fs.statSync(caminhoOriginal).size
              });
            })
            .on('error', (error) => {
              console.error('❌ Erro ao criar thumbnail:', error);
              // Continuar mesmo sem thumbnail
              resolve({
                caminhoThumb: null,
                largura: videoStream?.width,
                altura: videoStream?.height,
                duracao: duracao,
                tamanho: fs.statSync(caminhoOriginal).size
              });
            });
        });
      });

    } catch (error) {
      console.error('❌ Erro ao processar vídeo:', error);
      throw error;
    }
  }

  // ✅ BLOCO 3: Processar áudio (obter duração)
  async processarAudio(caminhoOriginal) {
    try {
      console.log('🎵 Processando áudio:', caminhoOriginal);

      return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(caminhoOriginal, (err, metadata) => {
          if (err) {
            reject(err);
            return;
          }

          const duracao = Math.floor(metadata.format.duration);
          const tamanho = fs.statSync(caminhoOriginal).size;

          resolve({
            duracao,
            tamanho
          });
        });
      });

    } catch (error) {
      console.error('❌ Erro ao processar áudio:', error);
      throw error;
    }
  }

  // ✅ BLOCO 3: Converter áudio para OGG (formato WhatsApp)
  async converterParaOgg(caminhoOriginal, filename) {
    try {
      console.log('🔄 Convertendo áudio para OGG:', filename);

      const caminhoOgg = path.join(
        path.dirname(caminhoOriginal),
        `${path.parse(filename).name}.ogg`
      );

      return new Promise((resolve, reject) => {
        ffmpeg(caminhoOriginal)
          .toFormat('ogg')
          .audioCodec('libopus')
          .audioBitrate('64k')
          .on('end', () => {
            // Deletar original
            fs.unlinkSync(caminhoOriginal);
            resolve(caminhoOgg);
          })
          .on('error', (error) => {
            reject(error);
          })
          .save(caminhoOgg);
      });

    } catch (error) {
      console.error('❌ Erro ao converter áudio:', error);
      throw error;
    }
  }

  // ✅ BLOCO 3: Obter URL pública do arquivo
  obterUrlPublica(filename) {
    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    return `${baseUrl}/uploads/media/${filename}`;
  }
}

module.exports = new MidiaServico();