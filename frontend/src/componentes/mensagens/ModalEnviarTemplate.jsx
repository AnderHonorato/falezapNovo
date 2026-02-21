// frontend/src/componentes/mensagens/ModalEnviarTemplate.jsx - ✅ VERSÃO CORRIGIDA

import React, { useState, useEffect } from 'react';
import { 
  X, FileText, ChevronDown, ChevronUp, Image, Video, 
  FileIcon, Type, MessageSquare, MousePointerClick, 
  Eye, Send, Loader2, AlertCircle, Info, RefreshCw
} from 'lucide-react';
import api from '../../servicos/api';
import toast from 'react-hot-toast';
import { useTema } from '../../contextos/TemaContexto';
import './css/ModalEnviarTemplate.css';

export default function ModalEnviarTemplate({ 
  isOpen, 
  onClose, 
  onEnviar, 
  enviando,
  conversaSelecionada // ✅ Recebe a conversa para pegar o conexaoWhatsAppId
}) {
  const { temaEscuro } = useTema();
  
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [templateSelecionado, setTemplateSelecionado] = useState(null);
  const [valoresVariaveis, setValoresVariaveis] = useState({});
  const [mostrarPreview, setMostrarPreview] = useState(true);
  const [erros, setErros] = useState({});
  const [step, setStep] = useState(1);

  // ✅ CARREGAR TEMPLATES AO ABRIR
  useEffect(() => {
    if (isOpen) {
      // ✅ TENTAR MÚLTIPLAS PROPRIEDADES POSSÍVEIS
      const conexaoId = conversaSelecionada?.conexaoWhatsAppId 
        || conversaSelecionada?.conexaoWhatsApp?.id
        || conversaSelecionada?.conexao?.id;
      
      console.log('🔍 ==========================================');
      console.log('🔍 Debug - Verificando conversa selecionada');
      console.log('==========================================');
      console.log('conversaSelecionada completa:', conversaSelecionada);
      console.log('conexaoWhatsAppId:', conversaSelecionada?.conexaoWhatsAppId);
      console.log('conexaoWhatsApp.id:', conversaSelecionada?.conexaoWhatsApp?.id);
      console.log('conexaoId encontrado:', conexaoId);
      console.log('==========================================\n');
      
      if (conexaoId) {
        console.log('✅ Carregando templates para conexão:', conexaoId);
        carregarTemplates(conexaoId);
      } else {
        console.warn('⚠️ ERRO: Nenhum conexaoId encontrado');
        console.warn('Propriedades disponíveis:', Object.keys(conversaSelecionada || {}));
        setLoadingTemplates(false);
        toast.error('Erro: Conexão WhatsApp não identificada. Verifique o console.');
      }
    }

    // Reset ao fechar
    if (!isOpen) {
      setStep(1);
      setTemplateSelecionado(null);
      setValoresVariaveis({});
      setErros({});
    }
  }, [isOpen, conversaSelecionada]);

  const carregarTemplates = async (conexaoId) => {
    try {
      setLoadingTemplates(true);
      console.log('📡 Fazendo requisição GET /templates...');
      console.log('   Params:', { conexaoId });
      
      const response = await api.get('/templates', {
        params: { conexaoId }
      });
      
      console.log('✅ Resposta recebida:', response.data);
      
      if (response.data.sucesso) {
        setTemplates(response.data.templates || []);
        console.log(`✅ ${response.data.templates?.length || 0} templates carregados`);
      } else {
        toast.error(response.data.erro || 'Erro ao carregar templates');
      }
    } catch (error) {
      console.error('❌ ==========================================');
      console.error('❌ Erro ao carregar templates');
      console.error('==========================================');
      console.error('Erro completo:', error);
      console.error('Response:', error.response?.data);
      console.error('Status:', error.response?.status);
      console.error('==========================================\n');
      
      if (error.response?.status === 404) {
        toast.error('Endpoint /templates não encontrado. Verifique o backend.');
      } else {
        toast.error(error.response?.data?.erro || 'Erro ao carregar templates');
      }
      
      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSincronizar = async () => {
    try {
      // ✅ VALIDAÇÃO: Tentar múltiplas propriedades possíveis
      const conexaoId = conversaSelecionada?.conexaoWhatsAppId 
        || conversaSelecionada?.conexaoWhatsApp?.id
        || conversaSelecionada?.conexao?.id;
      
      if (!conexaoId) {
        console.error('❌ ==========================================');
        console.error('❌ ERRO: conexaoId não encontrado');
        console.error('==========================================');
        console.error('conversaSelecionada:', conversaSelecionada);
        console.error('Propriedades disponíveis:', Object.keys(conversaSelecionada || {}));
        console.error('==========================================\n');
        toast.error('Erro: Conexão WhatsApp não identificada');
        return;
      }
      
      setSincronizando(true);
      const toastId = toast.loading('Sincronizando templates com a Meta...');
      
      console.log('🔄 ==========================================');
      console.log('🔄 Sincronizando templates...');
      console.log('==========================================');
      console.log('🔌 Conexão ID:', conexaoId);
      console.log('📦 Payload:', JSON.stringify({ conexaoId }, null, 2));
      console.log('==========================================\n');
      
      const response = await api.post('/templates/sincronizar', {
        conexaoId: conexaoId
      });
      
      toast.dismiss(toastId);
      
      console.log('✅ Resposta da sincronização:', response.data);
      
      if (response.data.sucesso) {
        toast.success(response.data.mensagem || 'Templates sincronizados!');
        setTemplates(response.data.templates || []);
        console.log(`✅ ${response.data.templates?.length || 0} templates sincronizados`);
      } else {
        toast.error(response.data.erro || 'Erro ao sincronizar');
      }
    } catch (error) {
      toast.dismiss();
      console.error('❌ ==========================================');
      console.error('❌ Erro ao sincronizar templates');
      console.error('==========================================');
      console.error('Erro completo:', error);
      console.error('Response:', error.response?.data);
      console.error('Status:', error.response?.status);
      console.error('==========================================\n');
      
      toast.error(error.response?.data?.erro || 'Erro ao sincronizar templates');
    } finally {
      setSincronizando(false);
    }
  };

  const extrairVariaveis = (template) => {
    const variaveis = [];
    
    if (!template?.componentes) return variaveis;
    
    template.componentes.forEach(comp => {
      // Header com variáveis
      if (comp.type === 'HEADER' && comp.format === 'TEXT' && comp.text) {
        const matches = comp.text.match(/\{\{(\d+)\}\}/g);
        if (matches) {
          matches.forEach(match => {
            const index = match.match(/\d+/)[0];
            variaveis.push({
              tipo: 'HEADER',
              index: parseInt(index),
              nome: `header_${index}`,
              exemplo: comp.example?.header_text?.[parseInt(index) - 1] || ''
            });
          });
        }
      }
      
      // Body com variáveis
      if (comp.type === 'BODY' && comp.text) {
        const matches = comp.text.match(/\{\{(\d+)\}\}/g);
        if (matches) {
          matches.forEach(match => {
            const index = match.match(/\d+/)[0];
            variaveis.push({
              tipo: 'BODY',
              index: parseInt(index),
              nome: `body_${index}`,
              exemplo: comp.example?.body_text?.[0]?.[parseInt(index) - 1] || ''
            });
          });
        }
      }
    });
    
    return variaveis;
  };

  const gerarPreview = () => {
    if (!templateSelecionado) return '';
    
    let preview = '';
    
    templateSelecionado.componentes.forEach(comp => {
      if (comp.type === 'HEADER' && comp.format === 'TEXT' && comp.text) {
        let textoHeader = comp.text;
        Object.keys(valoresVariaveis).forEach(key => {
          if (key.startsWith('header_')) {
            const index = key.split('_')[1];
            textoHeader = textoHeader.replace(`{{${index}}}`, valoresVariaveis[key] || `{{${index}}}`);
          }
        });
        preview += `*${textoHeader}*\n\n`;
      }
      
      if (comp.type === 'BODY' && comp.text) {
        let textoBody = comp.text;
        Object.keys(valoresVariaveis).forEach(key => {
          if (key.startsWith('body_')) {
            const index = key.split('_')[1];
            textoBody = textoBody.replace(`{{${index}}}`, valoresVariaveis[key] || `{{${index}}}`);
          }
        });
        preview += textoBody + '\n\n';
      }
      
      if (comp.type === 'FOOTER' && comp.text) {
        preview += `_${comp.text}_`;
      }
    });
    
    return preview;
  };

  const validarPreenchimento = () => {
    const variaveis = extrairVariaveis(templateSelecionado);
    const novosErros = {};
    
    variaveis.forEach(variavel => {
      if (!valoresVariaveis[variavel.nome] || valoresVariaveis[variavel.nome].trim() === '') {
        novosErros[variavel.nome] = 'Campo obrigatório';
      }
    });
    
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

const handleEnviar = async () => {
  if (!validarPreenchimento()) {
    toast.error('Preencha todos os campos obrigatórios');
    return;
  }
  
  // ✅ 1. Pega a definição das variáveis (que já estão em ordem)
  const variaveisOrdenadas = extrairVariaveis(templateSelecionado);
  
  // ✅ 2. Cria um array APENAS com os valores, na ordem correta
  const valoresEmArray = variaveisOrdenadas.map(v => valoresVariaveis[v.nome]);

  await onEnviar({
    templateId: templateSelecionado.id,
    nomeTemplate: templateSelecionado.nomeTemplate,
    variaveis: valoresEmArray  // ✅ 3. Envia o array de valores
  });
};

  const handleProximo = () => {
    if (!templateSelecionado) {
      toast.error('Selecione um template');
      return;
    }
    
    const variaveis = extrairVariaveis(templateSelecionado);
    const valoresIniciais = {};
    variaveis.forEach(v => {
      valoresIniciais[v.nome] = v.exemplo || '';
    });
    setValoresVariaveis(valoresIniciais);
    setStep(2);
  };

  const handleVoltar = () => {
    setStep(1);
    setValoresVariaveis({});
    setErros({});
  };

  // ✅ NÃO RENDERIZAR SE NÃO ESTIVER ABERTO
  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${!temaEscuro ? 'light-theme' : ''}`}>
      <div className="modal-template-container">
        
        {/* HEADER */}
        <div className="modal-template-header">
          <div className="modal-template-header-content">
            <div className="modal-template-icon-wrapper">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="modal-template-title">Enviar Template Personalizado</h2>
              <p className="modal-template-subtitle">
                {step === 1 ? 'Selecione um dos modelos aprovados. ' : 'Preencha as informações de acordo com a váriavel do template selecionado. Pode ter mais de uma variável dependendo de como o template foi criado.'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {step === 1 && (
              <button
                onClick={handleSincronizar}
                className="btn-icon"
                disabled={sincronizando || loadingTemplates}
                title="Sincronizar templates com a Meta"
              >
                <RefreshCw className={`w-5 h-5 ${sincronizando ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button onClick={onClose} className="modal-template-close-btn" disabled={enviando}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="modal-template-body">
          
          {/* LOADING */}
          {loadingTemplates && (
            <div className="loading-container">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p>Carregando templates...</p>
            </div>
          )}

          {/* SEM TEMPLATES */}
          {!loadingTemplates && templates.length === 0 && (
            <div className="empty-state">
              <FileText className="w-12 h-12" />
              <h3>Nenhum template encontrado</h3>
              <p>Crie templates no Meta Business Suite e clique em sincronizar.</p>
              <button onClick={handleSincronizar} className="btn-primary" disabled={sincronizando}>
                <RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} />
                Sincronizar Agora
              </button>
            </div>
          )}

          {/* STEP 1: LISTA DE TEMPLATES */}
          {!loadingTemplates && templates.length > 0 && step === 1 && (
            <div className="templates-list">
              {templates.map(template => (
                <div
                  key={template.id}
                  className={`template-card ${templateSelecionado?.id === template.id ? 'selected' : ''}`}
                  onClick={() => setTemplateSelecionado(template)}
                >
                  <div className="template-card-header">
                    <div className="template-card-icon">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="template-card-info">
                      <h3 className="template-card-title">{template.nomeTemplate}</h3>
                      <div className="template-card-badges">
                        <span className={`badge badge-${template.categoria.toLowerCase()}`}>
                          {template.categoria}
                        </span>
                        <span className="badge badge-approved">{template.status}</span>
                        <span className="badge badge-language">{template.linguagem}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="template-card-components">
                    {template.componentes.map((comp, idx) => (
                      <div key={idx} className="component-tag">
                        {comp.type === 'HEADER' && comp.format === 'TEXT' && <Type className="w-3 h-3" />}
                        {comp.type === 'HEADER' && comp.format === 'IMAGE' && <Image className="w-3 h-3" />}
                        {comp.type === 'HEADER' && comp.format === 'VIDEO' && <Video className="w-3 h-3" />}
                        {comp.type === 'HEADER' && comp.format === 'DOCUMENT' && <FileIcon className="w-3 h-3" />}
                        {comp.type === 'BODY' && <MessageSquare className="w-3 h-3" />}
                        {comp.type === 'FOOTER' && <Info className="w-3 h-3" />}
                        {comp.type === 'BUTTONS' && <MousePointerClick className="w-3 h-3" />}
                        <span>{comp.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 2: PREENCHER VARIÁVEIS */}
          {!loadingTemplates && step === 2 && templateSelecionado && (
            <div className="template-form-container">
              <div className="template-form-grid">
                
                {/* FORMULÁRIO */}
                <div className="template-form-section">
                  <h3 className="section-title">Preencha os campos</h3>
                  
                  {extrairVariaveis(templateSelecionado).length === 0 ? (
                    <p style={{ color: '#999', fontSize: '14px' }}>
                      Este template não possui variáveis para preencher.
                    </p>
                  ) : (
                    extrairVariaveis(templateSelecionado).map((variavel) => (
                      <div key={variavel.nome} className="form-group">
                        <label className="form-label">
                          {variavel.tipo} - Variável {variavel.index}
                          <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-input ${erros[variavel.nome] ? 'error' : ''}`}
                          placeholder={variavel.exemplo || `Digite o valor para {{${variavel.index}}}`}
                          value={valoresVariaveis[variavel.nome] || ''}
                          onChange={(e) => {
                            setValoresVariaveis(prev => ({
                              ...prev,
                              [variavel.nome]: e.target.value
                            }));
                            if (erros[variavel.nome]) {
                              setErros(prev => {
                                const novosErros = { ...prev };
                                delete novosErros[variavel.nome];
                                return novosErros;
                              });
                            }
                          }}
                        />
                        {erros[variavel.nome] && (
                          <span className="error-message">
                            <AlertCircle className="w-4 h-4" />
                            {erros[variavel.nome]}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* PREVIEW */}
                <div className="template-preview-section">
                  <div className="preview-header">
                    <h3 className="section-title">Pré-visualização</h3>
                    <button
                      onClick={() => setMostrarPreview(!mostrarPreview)}
                      className="btn-icon-small"
                    >
                      {mostrarPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {mostrarPreview && (
                    <div className="preview-content">
                      <div className="preview-phone">
                        <div className="preview-message">
                          {gerarPreview().split('\n').map((linha, i) => (
                            <p key={i}>{linha}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="modal-template-footer">
          {step === 1 ? (
            <>
              <button onClick={onClose} className="btn-secondary" disabled={enviando}>
                Cancelar
              </button>
              <button 
                onClick={handleProximo} 
                className="btn-primary"
                disabled={!templateSelecionado || enviando}
              >
                Próximo
              </button>
            </>
          ) : (
            <>
              <button onClick={handleVoltar} className="btn-secondary" disabled={enviando}>
                Voltar
              </button>
              <button 
                onClick={handleEnviar} 
                className="btn-primary"
                disabled={enviando}
              >
                {enviando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar Template
                  </>
                )}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}