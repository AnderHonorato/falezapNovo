// src/utils/notificacoes.js

/**
 * Utilitário para gerenciar notificações do navegador
 */

export class GerenciadorNotificacoes {
  constructor() {
    this.permissao = Notification.permission;
  }

  // Solicitar permissão para notificações
  async solicitarPermissao() {
    if (this.permissao === 'default') {
      this.permissao = await Notification.requestPermission();
    }
    return this.permissao === 'granted';
  }

  // Verificar se notificações estão habilitadas
  estaHabilitado() {
    return this.permissao === 'granted';
  }

  // Enviar notificação
  enviar(titulo, opcoes = {}) {
    if (!this.estaHabilitado()) {
      console.warn('Notificações não estão habilitadas');
      return null;
    }

    const opcoesDefault = {
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'falezap-notification',
      requireInteraction: false,
      silent: false,
      ...opcoes
    };

    try {
      const notification = new Notification(titulo, opcoesDefault);

      // Auto-fechar após 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (erro) {
      console.error('Erro ao enviar notificação:', erro);
      return null;
    }
  }

  // Enviar notificação de nova mensagem
  novaMensagem(contato, mensagem) {
    return this.enviar('Nova mensagem no WhatsApp', {
      body: `${contato}:\n${mensagem.substring(0, 100)}`,
      icon: '/whatsapp-icon.png',
      tag: 'nova-mensagem'
    });
  }

  // Enviar notificação de conexão
  whatsappConectado(numero) {
    return this.enviar('WhatsApp Conectado', {
      body: `Conectado com sucesso: ${numero}`,
      icon: '/whatsapp-icon.png',
      tag: 'whatsapp-conectado'
    });
  }

  // Enviar notificação de desconexão
  whatsappDesconectado() {
    return this.enviar('WhatsApp Desconectado', {
      body: 'Sua conexão foi perdida',
      icon: '/whatsapp-icon.png',
      tag: 'whatsapp-desconectado'
    });
  }
}

// Exportar instância única
export const notificacoes = new GerenciadorNotificacoes();