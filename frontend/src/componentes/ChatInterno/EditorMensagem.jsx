import { useState, useRef, useEffect } from 'react';
import { Smile, Paperclip, Send, Mic, Loader2, Bold, Italic, Strikethrough, Code } from 'lucide-react';
import { useAuth } from '../../contextos/AuthContext';
import api from '../../servicos/api';
import toast from 'react-hot-toast';
import useAudio from '../../hooks/useAudio'; 

const EMOJIS_POPULARES = ['😀','😂','🥰','😎','🤔','😭','👍','👎','🔥','✅','🎉','❤️','👀','🚀','✨'];

export default function EditorMensagem({ conversaAtual, rolarParaFinal, onMensagemEnviada }) {
  const { usuario } = useAuth();
  const playSomEnviar = useAudio('ENVIAR');
  const [conteudo, setConteudo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  const [mostrarFormatacao, setMostrarFormatacao] = useState(false);
  const [mostrarMencoes, setMostrarMencoes] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [buscaMencao, setBuscaMencao] = useState('');
  
  const textareaRef = useRef(null);
  const containerRef = useRef(null);
  const formatacaoRef = useRef(null);

  useEffect(() => {
    const carregarUsuarios = async () => {
        try {
            const res = await api.get('/usuarios/equipe-membros'); 
            const lista = Array.isArray(res.data) ? res.data : res.data.membros || [];
            setUsuarios(lista.filter(u => u.id !== usuario.id));
        } catch (e) { console.error(e); }
    };
    if (conversaAtual.tipo === 'grupo') carregarUsuarios();
  }, [conversaAtual.tipo, usuario.id]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; 
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [conteudo]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setMostrarEmojis(false);
        setMostrarMencoes(false);
      }
      if (formatacaoRef.current && !formatacaoRef.current.contains(e.target) && textareaRef.current && !textareaRef.current.contains(e.target)) {
          setMostrarFormatacao(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const novoValor = e.target.value;
    setConteudo(novoValor);
    const cursor = e.target.selectionStart;
    const textoAteCursor = novoValor.substring(0, cursor);
    const lastAt = textoAteCursor.lastIndexOf('@');
    if (lastAt !== -1 && conversaAtual.tipo === 'grupo') {
       const textoAposArroba = textoAteCursor.substring(lastAt + 1);
       if (!textoAposArroba.includes(' ')) {
           setBuscaMencao(textoAposArroba);
           setMostrarMencoes(true);
           return;
       }
    }
    setMostrarMencoes(false);
  };

  const inserirMencao = (user) => {
    const cursor = textareaRef.current.selectionStart;
    const textoAteCursor = conteudo.substring(0, cursor);
    const lastAt = textoAteCursor.lastIndexOf('@');
    const prefixo = conteudo.substring(0, lastAt);
    const sufixo = conteudo.substring(cursor);
    const mencao = `@[${user.nome}](${user.id}) `;
    setConteudo(prefixo + mencao + sufixo);
    setMostrarMencoes(false);
    setTimeout(() => textareaRef.current.focus(), 10);
  };

  const handleSelect = () => {
    setTimeout(() => {
        if (textareaRef.current) {
            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;
            if (start !== end) setMostrarFormatacao(true);
        }
    }, 50); 
  };

  const aplicarFormatacao = (tipo) => {
    const input = textareaRef.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    
    // Sintaxe Markdown Padrão
    let wrapper = '';
    if (tipo === 'bold') wrapper = '**'; 
    if (tipo === 'italic') wrapper = '_'; 
    if (tipo === 'strike') wrapper = '~~'; 
    if (tipo === 'code') wrapper = '```'; 

    let novoConteudo;
    let novoCursorPos;

    if (start !== end) {
        const selected = conteudo.substring(start, end);
        novoConteudo = conteudo.substring(0, start) + wrapper + selected + wrapper + conteudo.substring(end);
        novoCursorPos = end + (wrapper.length * 2);
    } else {
        novoConteudo = conteudo.substring(0, start) + wrapper + wrapper + conteudo.substring(end);
        novoCursorPos = start + wrapper.length; 
    }
    setConteudo(novoConteudo);
    setMostrarFormatacao(false);
    setTimeout(() => { input.focus(); input.setSelectionRange(novoCursorPos, novoCursorPos); }, 10);
  };

  const enviar = async (e) => {
    e?.preventDefault();
    if (!conteudo.trim()) return;
    setEnviando(true);
    
    // Guarda referência local caso o componente desmonte
    const inputRef = textareaRef.current;

    try {
      let novaMensagem;
      const formData = new FormData();
      formData.append('conteudo', conteudo);
      
      if (conversaAtual.tipo === 'suporte') {
         const id = conversaAtual.solicitacao?.id || conversaAtual.id.replace('suporte-', '');
         const res = await api.post(`/chat-suporte/mensagens/${id}`, { conteudo });
         novaMensagem = res.data.mensagem;
      } else {
         if(conversaAtual.tipo === 'individual') {
             const destinatarioId = conversaAtual.destinatario?.usuarioId || conversaAtual.destinatario?.id;
             formData.append('destinatarioId', destinatarioId);
         } else if(conversaAtual.tipo === 'grupo') {
             formData.append('grupoId', conversaAtual.grupo.id);
         }
         const res = await api.post('/chat-interno/mensagens', formData);
         novaMensagem = res.data.mensagem;
      }
      setConteudo('');
      if (inputRef) inputRef.style.height = 'auto';
      if (onMensagemEnviada) onMensagemEnviada(novaMensagem);
      playSomEnviar();
      setTimeout(rolarParaFinal, 100);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setEnviando(false);
      // ✅ CORREÇÃO: Devolve o foco para o textarea imediatamente após liberar o envio
      setTimeout(() => {
          if (inputRef) inputRef.focus();
      }, 10);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  const usuariosFiltrados = usuarios.filter(u => u.nome.toLowerCase().includes(buscaMencao.toLowerCase())).slice(0, 5);

  return (
    <div className="chat-editor-area" ref={containerRef}>
      {/* Menu Flutuante de Formatação */}
      {mostrarFormatacao && (
        <div className="format-menu-floating" ref={formatacaoRef}>
           <button onClick={() => aplicarFormatacao('bold')}><Bold size={16}/></button>
           <button onClick={() => aplicarFormatacao('italic')}><Italic size={16}/></button>
           <button onClick={() => aplicarFormatacao('strike')}><Strikethrough size={16}/></button>
           <button onClick={() => aplicarFormatacao('code')}><Code size={16}/></button>
        </div>
      )}

      {/* Popovers */}
      {mostrarMencoes && usuariosFiltrados.length > 0 && (
         <div className="mentions-popover-local">
            {usuariosFiltrados.map(u => (
               <button key={u.id} className="mention-item" onClick={() => inserirMencao(u)}>
                  <span className="font-bold mr-2">{u.nome}</span>
               </button>
            ))}
         </div>
      )}

      {mostrarEmojis && (
        <div className="emoji-picker-popover">
          <div className="grid grid-cols-5 gap-1 p-1">
            {EMOJIS_POPULARES.map(emoji => (
              <button key={emoji} onClick={() => { setConteudo(p => p + emoji); setMostrarEmojis(false); textareaRef.current?.focus(); }} className="text-xl hover:bg-gray-100 p-1.5 rounded transition-colors">
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ÁREA DE TEXTO UNIFICADA */}
      <div className="textarea-container">
        
        {/* Ícones da Esquerda */}
        <div className="input-actions left">
            <button 
                onClick={() => setMostrarEmojis(!mostrarEmojis)} 
                className={`icon-btn ${mostrarEmojis ? 'active' : ''}`} 
                disabled={enviando}
                title="Emojis"
            >
                <Smile size={20} strokeWidth={1.5} />
            </button>
            <button className="icon-btn" disabled={enviando} title="Anexar">
                <Paperclip size={20} strokeWidth={1.5} />
            </button>
        </div>

        {/* Textarea Transparente */}
        <textarea
            ref={textareaRef}
            value={conteudo}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onSelect={handleSelect}
            placeholder="Digite uma mensagem..."
            className="input-textarea custom-scrollbar"
            rows={1}
            disabled={enviando}
            autoFocus
        />

        {/* Ícones da Direita */}
        <div className="input-actions right">
             {conteudo.trim() ? (
                <button onClick={enviar} disabled={enviando} className="send-btn-integrated">
                    {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={20} className="ml-0.5" />}
                </button>
            ) : (
                <button className="icon-btn" disabled={enviando} title="Gravar Áudio">
                    <Mic size={20} />
                </button>
            )}
        </div>
      </div>
    </div>
  );
}