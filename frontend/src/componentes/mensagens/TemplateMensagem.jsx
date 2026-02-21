// frontend/src/componentes/mensagens/TemplateMensagem.jsx
// ✅ Componente para renderizar templates visualmente

import React, { useState, useEffect } from 'react';
import { ExternalLink, Phone, Copy, CheckCircle } from 'lucide-react';
import api from '../../servicos/api';
import './css/TemplateMensagem.css';

export default function TemplateMensagem({ mensagem, conversaSelecionada }) {
  const [templateData, setTemplateData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const processarTemplate = async () => {
      try {
        // Tentar parsear como JSON primeiro
        if (mensagem.conteudo.startsWith('{')) {
          const parsed = JSON.parse(mensagem.conteudo);
          setTemplateData(parsed);
          setLoading(false);
          return;
        }
        
        // Se é texto simples, extrair nome do template e variáveis
        const linhas = mensagem.conteudo.split('\n');
        let nomeTemplate = null;
        let variaveis = [];
        
        for (const linha of linhas) {
          if (linha.startsWith('Template:')) {
            nomeTemplate = linha.replace('Template:', '').trim();
          }
          if (linha.startsWith('Valores:')) {
            const valores = linha.replace('Valores:', '').trim();
            variaveis = valores.split(',').map(v => v.trim());
          }
        }
        
        if (!nomeTemplate) {
          console.warn('⚠️ Nome do template não encontrado');
          setLoading(false);
          return;
        }
        
        // Buscar conexaoId da conversa (tentar múltiplas propriedades)
        const conexaoId = conversaSelecionada?.conexaoWhatsAppId 
          || conversaSelecionada?.conexaoWhatsApp?.id
          || conversaSelecionada?.conexao?.id;
        
        if (!conexaoId) {
          console.warn('⚠️ conexaoId não encontrado, usando fallback simples');
          setLoading(false);
          return;
        }
        
        // Buscar templates da conexão via API
        console.log('🔍 Buscando templates da conexão:', conexaoId);
        const response = await api.get('/templates', {
          params: { conexaoId }
        });
        
        if (response.data.sucesso && response.data.templates?.length > 0) {
          // Encontrar o template pelo nome
          const template = response.data.templates.find(
            t => t.nomeTemplate === nomeTemplate
          );
          
          if (!template) {
            console.warn(`⚠️ Template "${nomeTemplate}" não encontrado na lista`);
            setLoading(false);
            return;
          }
          
          // Parsear componentes
          let componentes = typeof template.componentes === 'string'
            ? JSON.parse(template.componentes)
            : template.componentes;
          
          // Aplicar variáveis nos componentes
          const componentesPreenchidos = componentes.map(comp => {
            if (comp.type === 'BODY' && comp.text) {
              let texto = comp.text;
              variaveis.forEach((valor, index) => {
                texto = texto.replace(`{{${index + 1}}}`, valor);
              });
              return { ...comp, text: texto };
            }
            if (comp.type === 'HEADER' && comp.format === 'TEXT' && comp.text) {
              let texto = comp.text;
              variaveis.forEach((valor, index) => {
                texto = texto.replace(`{{${index + 1}}}`, valor);
              });
              return { ...comp, text: texto };
            }
            return comp;
          });
          
          setTemplateData({
            nomeTemplate: template.nomeTemplate,
            componentes: componentesPreenchidos
          });
        }
      } catch (error) {
        console.error('❌ Erro ao processar template:', error);
      } finally {
        setLoading(false);
      }
    };
    
    processarTemplate();
  }, [mensagem.conteudo, conversaSelecionada]);
  
  // Loading state
  if (loading) {
    return (
      <div className="template-mensagem-simples">
        <div className="template-icon">⏳</div>
        <div className="template-content">Carregando template...</div>
      </div>
    );
  }

  // Se não tem estrutura, renderiza como texto simples
  if (!templateData || !templateData.componentes) {
    return (
      <div className="template-mensagem-simples">
        <div className="template-icon">📋</div>
        <div className="template-content">
          {mensagem.conteudo}
        </div>
      </div>
    );
  }

  // Renderizar cada componente do template
  return (
    <div className="template-mensagem">
      {templateData.componentes.map((comp, idx) => {
        // HEADER
        if (comp.type === 'HEADER') {
          if (comp.format === 'TEXT') {
            return (
              <div key={idx} className="template-header">
                <strong>{comp.text}</strong>
              </div>
            );
          }
          if (comp.format === 'IMAGE' && comp.url) {
            return (
              <div key={idx} className="template-header-media">
                <img src={comp.url} alt="Header" />
              </div>
            );
          }
          if (comp.format === 'VIDEO' && comp.url) {
            return (
              <div key={idx} className="template-header-media">
                <video src={comp.url} controls />
              </div>
            );
          }
        }

        // BODY
        if (comp.type === 'BODY') {
          return (
            <div key={idx} className="template-body">
              {comp.text}
            </div>
          );
        }

        // FOOTER
        if (comp.type === 'FOOTER') {
          return (
            <div key={idx} className="template-footer">
              {comp.text}
            </div>
          );
        }

        // BUTTONS
        if (comp.type === 'BUTTONS' && comp.buttons) {
          return (
            <div key={idx} className="template-buttons">
              {comp.buttons.map((button, btnIdx) => {
                // URL Button
                if (button.type === 'URL') {
                  return (
                    <button 
                      key={btnIdx} 
                      className="template-button template-button-url"
                      onClick={() => window.open(button.url, '_blank')}
                    >
                      <ExternalLink size={14} />
                      <span>{button.text}</span>
                    </button>
                  );
                }
                
                // Phone Button
                if (button.type === 'PHONE_NUMBER') {
                  return (
                    <button 
                      key={btnIdx} 
                      className="template-button template-button-phone"
                      onClick={() => window.open(`tel:${button.phone_number}`, '_self')}
                    >
                      <Phone size={14} />
                      <span>{button.text}</span>
                    </button>
                  );
                }
                
                // Quick Reply
                if (button.type === 'QUICK_REPLY') {
                  return (
                    <button 
                      key={btnIdx} 
                      className="template-button template-button-reply"
                      disabled
                    >
                      <CheckCircle size={14} />
                      <span>{button.text}</span>
                    </button>
                  );
                }

                // Copy Code
                if (button.type === 'COPY_CODE') {
                  return (
                    <button 
                      key={btnIdx} 
                      className="template-button template-button-copy"
                      onClick={() => {
                        navigator.clipboard.writeText(button.example);
                        alert('Código copiado!');
                      }}
                    >
                      <Copy size={14} />
                      <span>{button.text}</span>
                    </button>
                  );
                }

                return null;
              })}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}