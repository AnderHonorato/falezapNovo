// frontend/src/componentes/ModalContatos.jsx - ✅ VERSÃO FINAL (EXPORTAÇÃO CORRIGIDA)

import React, { useState, useEffect } from 'react';
import {
  X, Search, UserPlus, Edit2, Trash2, Save, Phone, Mail,
  User, Upload, Download, Loader2, MessageCircle, AlertCircle
} from 'lucide-react';
import { useTema } from '../contextos/TemaContexto';
import api from '../servicos/api';
import toast from 'react-hot-toast';
import ModalPerfilContato from './ModalPerfilContato';
import './mensagens/css/ModalContatos.css'; 

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const formatarTelefoneInput = (valor) => {
  let limpo = valor.replace(/\D/g, '');
  if (limpo.startsWith('55')) limpo = limpo.substring(2);
  if (limpo.length > 11) limpo = limpo.substring(0, 11);
  let formatado = '';
  if (limpo.length > 2) {
    formatado = `(${limpo.substring(0, 2)}) `;
    if (limpo.length > 7) formatado += `${limpo.substring(2, 7)}-${limpo.substring(7)}`;
    else if (limpo.length > 6) formatado += `${limpo.substring(2, 6)}-${limpo.substring(6)}`;
    else formatado += limpo.substring(2);
  } else if (limpo.length > 0) formatado = `(${limpo}`;
  return `+55 ${formatado}`.trim();
};

const formatarTelefone = (tel) => {
  const limpo = tel?.replace(/\D/g, '') || '';
  if (limpo.startsWith('55') && limpo.length >= 12) {
    const ddd = limpo.slice(2, 4);
    const num = limpo.slice(4);
    return `(${ddd}) ${num.slice(0, num.length === 9 ? 5 : 4)}-${num.slice(num.length === 9 ? 5 : 4)}`;
  }
  return tel; 
};

export default function ModalContatos({ 
  isOpen, 
  onClose, 
  onContatoSelecionado,
  onContatoCriado, 
  proposito = 'criar_e_abrir'
}) {
  const { temaEscuro } = useTema();
  const [contatos, setContatos] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [carregando, setCarregando] = useState(false); 
  const [carregandoAcao, setCarregandoAcao] = useState(false); 
  const [editando, setEditando] = useState(null);
  const [novoContato, setNovoContato] = useState({ nome: '', telefone: '', email: '', foto: null });
  const [modoAdicionar, setModoAdicionar] = useState(false);
  
  const [perfilModalAberto, setPerfilModalAberto] = useState(false);
  const [contatoParaPerfil, setContatoParaPerfil] = useState(null);

  const [verificando, setVerificando] = useState(false);
  const [contatoExisteErro, setContatoExisteErro] = useState(null);
  const telefoneDebounced = useDebounce(novoContato.telefone, 500);

  useEffect(() => {
    if (isOpen) carregarContatos();
  }, [isOpen]);

  useEffect(() => {
    const verificar = async () => {
      const numeroLimpo = telefoneDebounced.replace(/\D/g, '');
      if (numeroLimpo.length < 12) {
        setContatoExisteErro(null);
        setVerificando(false);
        return;
      }
      setVerificando(true);
      try {
        const response = await api.get(`/contatos/verificar/${numeroLimpo}`);
        if (response.data.sucesso && response.data.existe) {
          setContatoExisteErro('Este número já está cadastrado.');
        } else {
          setContatoExisteErro(null);
        }
      } catch (error) {
        console.error("Erro verificação:", error);
      } finally {
        setVerificando(false);
      }
    };
    if (telefoneDebounced && !editando) verificar();
    else setContatoExisteErro(null);
  }, [telefoneDebounced, editando]);

  const carregarContatos = async () => {
    try {
      setCarregando(true);
      const response = await api.get('/contatos'); 
      if (response.data.sucesso) {
        const contatosRaw = response.data.conversas || []; 
        const contatosFormatados = contatosRaw.map(conv => ({
          id: conv.id,
          nome: conv.nomeContato || conv.numeroCliente,
          telefone: conv.numeroCliente,
          email: conv.email || '',
          foto: conv.fotoUrl || conv.foto_perfil,
          conversa: conv 
        }));
        setContatos(contatosFormatados);
      }
    } catch (error) {
      toast.error('Erro ao carregar contatos');
    } finally {
      setCarregando(false);
    }
  };

  const handleSalvarContato = async () => {
    if (!novoContato.nome.trim()) return toast.error('Nome obrigatório');
    
    let numeroLimpo = novoContato.telefone.replace(/\D/g, '');
    if (!numeroLimpo.startsWith('55') && (numeroLimpo.length === 10 || numeroLimpo.length === 11)) {
      numeroLimpo = '55' + numeroLimpo;
    }
    if (numeroLimpo.length < 12) return toast.error('Telefone inválido');
    if (contatoExisteErro && !editando) return toast.error(contatoExisteErro);

    setCarregandoAcao(true);
    try {
      let res;
      if (editando) {
        res = await api.put(`/contatos/${editando}`, {
          nomeContato: novoContato.nome,
          email: novoContato.email
        });
        toast.success('Atualizado!');
      } else {
        res = await api.post('/contatos', {
          nomeContato: novoContato.nome,
          numeroCliente: numeroLimpo, 
          email: novoContato.email
        });
        toast.success('Criado!');
      }

      if (onContatoCriado) onContatoCriado(res.data.conversa);
      
      if (onContatoSelecionado && proposito === 'criar_e_abrir' && !editando) {
        onContatoSelecionado(res.data.conversa);
        onClose();
        return;
      }

      setModoAdicionar(false);
      setEditando(null);
      setNovoContato({ nome: '', telefone: '', email: '', foto: null });
      carregarContatos();
    } catch (error) {
      toast.error(error.response?.data?.erro || 'Erro ao salvar');
    } finally {
      setCarregandoAcao(false);
    }
  };

  const handleExcluirContato = async (id) => {
    if (!confirm('Excluir contato?')) return;
    try {
      await api.delete(`/conversas/${id}`);
      toast.success('Excluído!');
      carregarContatos();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const handleImportarContatos = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('arquivo', file); 
    setCarregandoAcao(true); 
    const toastId = toast.loading('Importando...');
    try {
      const response = await api.post('/contatos/importar', formData);
      if (response.data.sucesso) {
        toast.success(response.data.mensagem, { id: toastId });
        carregarContatos(); 
      }
    } catch (error) {
      toast.error('Erro ao importar', { id: toastId });
    } finally {
      setCarregandoAcao(false); 
      e.target.value = null; 
    }
  };

  // ✅ FUNÇÃO DE EXPORTAÇÃO (RECONECTADA)
  const handleExportarContatos = async () => {
    const toastId = toast.loading('Exportando contatos...');
    setCarregandoAcao(true);
    try {
      const response = await api.get('/contatos/exportar/vcf', {
        responseType: 'blob' 
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/vcard' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'contatos_falezap.vcf'); 
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Contatos exportados!', { id: toastId });
    } catch (error) {
      console.error('❌ Erro ao exportar:', error);
      toast.error('Erro ao exportar contatos.', { id: toastId });
    } finally {
      setCarregandoAcao(false);
    }
  };

  const contatosFiltrados = contatos.filter(c =>
    c.nome?.toLowerCase().includes(pesquisa.toLowerCase()) ||
    c.telefone?.includes(pesquisa)
  );

  if (!isOpen) return null;

  return (
    <div className="modal-contatos-overlay" onClick={onClose}>
      <div 
        className={`modal-contatos-container ${temaEscuro ? 'tema-escuro' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="mc-header">
          <div>
            <div className="mc-header-title">
              <UserPlus size={20} className="text-emerald-500" />
              <h3>Gerenciar Contatos</h3>
            </div>
            <span className="mc-header-subtitle">{contatos.length} contatos salvos</span>
          </div>
          <button onClick={onClose} className="mc-close-btn">
            <X size={20} />
          </button>
        </div>

        {/* TOOLBAR */}
        {!modoAdicionar && (
          <div className="mc-toolbar">
            <button 
              className="mc-btn-tool mc-btn-primary"
              onClick={() => {
                setModoAdicionar(true);
                setEditando(null);
                setNovoContato({ nome: '', telefone: '', email: '', foto: null });
              }}
            >
              <UserPlus size={16} /> Novo
            </button>
            <label className="mc-btn-tool">
              {carregandoAcao ? <Loader2 size={16} className="animate-spin"/> : <Upload size={16} />}
              Importar
              <input type="file" accept=".vcf" onChange={handleImportarContatos} hidden disabled={carregandoAcao} />
            </label>
            
            {/* ✅ BOTÃO RECONECTADO */}
            <button 
              className="mc-btn-tool" 
              onClick={handleExportarContatos}
              disabled={carregandoAcao}
            >
              {carregandoAcao ? <Loader2 size={16} className="animate-spin"/> : <Download size={16} />} 
              Exportar
            </button>
          </div>
        )}

        {/* FORMULÁRIO */}
        {modoAdicionar && (
          <div className="mc-form">
            <div className="mc-form-row">
              <input 
                type="text" 
                placeholder="Nome *"
                className="mc-input"
                value={novoContato.nome}
                onChange={e => setNovoContato({...novoContato, nome: e.target.value})}
                autoFocus
              />
            </div>
            <div className="mc-form-row">
              <div style={{flex: 1, position: 'relative'}}>
                <input 
                  type="text" 
                  placeholder="+55 (DDD) Número *"
                  className="mc-input"
                  value={novoContato.telefone}
                  onChange={e => setNovoContato({...novoContato, telefone: formatarTelefoneInput(e.target.value)})}
                  disabled={!!editando}
                />
                {verificando && <Loader2 size={14} className="animate-spin absolute right-3 top-3 text-yellow-500"/>}
                {contatoExisteErro && !editando && <AlertCircle size={14} className="absolute right-3 top-3 text-red-500" title={contatoExisteErro}/>}
              </div>
            </div>
            <div className="mc-form-row">
              <input 
                type="email" 
                placeholder="Email (opcional)"
                className="mc-input"
                value={novoContato.email}
                onChange={e => setNovoContato({...novoContato, email: e.target.value})}
              />
            </div>
            <div className="mc-form-actions">
              <button 
                className="mc-btn-tool"
                onClick={() => setModoAdicionar(false)}
              >
                Cancelar
              </button>
              <button 
                className="mc-btn-tool mc-btn-primary"
                onClick={handleSalvarContato}
                disabled={carregandoAcao || verificando || (contatoExisteErro && !editando)}
              >
                {carregandoAcao ? <Loader2 size={16} className="animate-spin"/> : <Save size={16} />}
                {editando ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        )}

        {/* BUSCA */}
        {!modoAdicionar && (
          <div className="mc-search-wrapper">
            <div className="mc-search-input-container">
              <Search className="mc-search-icon" />
              <input 
                type="text"
                placeholder="Buscar contatos..."
                value={pesquisa}
                onChange={e => setPesquisa(e.target.value)}
                className="mc-search-input"
              />
            </div>
          </div>
        )}

        {/* LISTA */}
        <div className="mc-lista">
          {carregando ? (
            <div className="mc-loading">
              <Loader2 size={24} className="animate-spin text-emerald-500"/>
              <span>Carregando...</span>
            </div>
          ) : contatosFiltrados.length === 0 ? (
            <div className="mc-empty">
              <User size={32} className="text-gray-300"/>
              <p>Nenhum contato encontrado.</p>
            </div>
          ) : (
            contatosFiltrados.map(contato => (
              <div key={contato.id} className="mc-item group">
                <div className="mc-avatar">
                  {contato.foto ? <img src={contato.foto} alt=""/> : <User size={18}/>}
                </div>
                <div className="mc-info">
                  <div className="mc-nome">{contato.nome}</div>
                  <div className="mc-detalhe">
                    <Phone size={10} /> {formatarTelefone(contato.telefone)}
                  </div>
                </div>
                
                <div className="mc-item-actions">
                  <button 
                    className="mc-btn-icon mc-btn-chat"
                    title="Conversar"
                    onClick={() => {
                      if(onContatoSelecionado) {
                        onContatoSelecionado(contato.conversa || contato);
                        onClose();
                      }
                    }}
                  >
                    <MessageCircle size={14} />
                  </button>
                  <button 
                    className="mc-btn-icon mc-btn-edit"
                    title="Editar"
                    onClick={() => {
                      setEditando(contato.id);
                      setNovoContato({
                        nome: contato.nome,
                        telefone: formatarTelefoneInput(contato.telefone),
                        email: contato.email,
                        foto: null
                      });
                      setModoAdicionar(true);
                    }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    className="mc-btn-icon mc-btn-del"
                    title="Excluir"
                    onClick={() => handleExcluirContato(contato.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {perfilModalAberto && (
        <ModalPerfilContato
          isOpen={perfilModalAberto}
          onClose={() => setPerfilModalAberto(false)}
          contato={contatoParaPerfil}
        />
      )}
    </div>
  );
}