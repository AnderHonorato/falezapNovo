import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import ImageResize from 'quill-image-resize-module-react'; 
import api from '../../servicos/api';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, Save, Loader2, Type, AlignLeft, 
  Image as ImageIcon, Upload, X, AlertTriangle, RefreshCw, 
  Tag, Star, Quote
} from 'lucide-react';

// Registra o módulo de redimensionamento
Quill.register('modules/imageResize', ImageResize);

class ErrorFallback extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("Erro no Form:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-10 text-center bg-red-50 dark:bg-red-900/20 rounded-xl m-4 border border-red-200 dark:border-red-800">
          <AlertTriangle className="text-red-500 w-12 h-12 mb-4" />
          <h2 className="text-lg font-bold text-red-700 dark:text-red-300">Erro ao carregar o editor</h2>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 mt-4">
            <RefreshCw size={16} /> Recarregar Página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const BlogNovoPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [titulo, setTitulo] = useState('');
  const [resumo, setResumo] = useState('');
  const [conteudo, setConteudo] = useState(''); 
  const [categoria, setCategoria] = useState('');
  const [autorFrase, setAutorFrase] = useState(''); 
  const [destaque, setDestaque] = useState(false); 
  
  const [tags, setTags] = useState([]); 
  const [tagInput, setTagInput] = useState('');

  const [imagemCapa, setImagemCapa] = useState(null); 
  const [previewUrl, setPreviewUrl] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [loadingDados, setLoadingDados] = useState(!!id);
  const fileInputRef = useRef(null);

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'align': []}],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image', 'video'], 
      ['clean']
    ],
    imageResize: { 
      parchment: Quill.import('parchment'),
      modules: ['Resize', 'DisplaySize']
    }
  }), []);

  useEffect(() => {
    if (id) {
      const carregarPost = async () => {
        try {
          const response = await api.get(`/blog/${id}`);
          const post = response.data?.post || response.data;

          if (post) {
            setTitulo(post.titulo || '');
            setResumo(post.resumo || '');
            setConteudo(post.conteudo || ''); 
            setCategoria(post.categoria || ''); 
            setAutorFrase(post.autorFrase || ''); 
            setDestaque(post.destaque || false);
            
            if (post.tags) {
                try {
                    setTags(typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags);
                } catch(e) { setTags([]); }
            }

            if (post.imagemCapa) {
               let url = post.imagemCapa;
               if (!url.startsWith('http') && !url.startsWith('data:')) {
                  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                  const baseUrl = new URL(apiUrl).origin; 
                  const cleanSrc = url.startsWith('/') ? url : `/${url}`;
                  url = `${baseUrl}${cleanSrc}`;
               }
               setPreviewUrl(url);
            }
          }
        } catch (e) {
          console.error("Erro ao carregar post:", e);
          toast.error('Erro ao carregar dados.');
        } finally {
          setLoadingDados(false);
        }
      };
      carregarPost();
    }
  }, [id]);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImagemCapa(file);
      try { setPreviewUrl(URL.createObjectURL(file)); } catch (err) {}
    }
  };

  const removeImage = () => {
    setImagemCapa(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddTag = (e) => {
      if (e.key === 'Enter' && tagInput.trim()) {
          e.preventDefault();
          if (!tags.includes(tagInput.trim())) {
              setTags([...tags, tagInput.trim()]);
          }
          setTagInput('');
      }
  };
  const removeTag = (t) => setTags(tags.filter(tag => tag !== t));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !conteudo.trim()) return toast.error('Título e Conteúdo obrigatórios');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('titulo', titulo);
      formData.append('resumo', resumo);
      formData.append('conteudo', conteudo);
      formData.append('categoria', categoria);
      formData.append('autorFrase', autorFrase);
      formData.append('destaque', destaque); 
      formData.append('tags', JSON.stringify(tags)); 

      if (imagemCapa) formData.append('imagem', imagemCapa);

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (id) {
        await api.put(`/blog/posts/${id}`, formData, config);
        toast.success('Post atualizado!');
      } else {
        await api.post('/blog', formData, config);
        toast.success('Post publicado!');
      }
      navigate('/blog');
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error('Erro ao salvar. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingDados) return <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;

  return (
    <ErrorFallback>
      <div className="max-w-7xl mx-auto animate-fadeIn pb-20 p-4 md:p-8 text-gray-800 dark:text-gray-100">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/blog')} className="p-2 bg-white dark:bg-gray-800 border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors shadow-sm"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none">{id ? 'Editar Publicação' : 'Criar Nova Publicação'}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Preencha os detalhes abaixo.</p>
            </div>
          </div>
          <div className="flex gap-3">
             <button onClick={() => navigate('/blog')} className="px-5 py-2.5 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors border border-gray-200 dark:border-gray-700">Cancelar</button>
             <button onClick={handleSubmit} disabled={loading} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-70 flex items-center gap-2">{loading ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} {id ? 'Salvar' : 'Publicar'}</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Esquerda: Conteúdo */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="mb-8">
                <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Type size={14}/> Manchete Principal</label>
                <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full text-2xl md:text-3xl font-bold p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 dark:text-white outline-none placeholder-gray-400 transition-all" placeholder="Digite um título..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-2"><AlignLeft size={14}/> Conteúdo do Artigo</label>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <ReactQuill theme="snow" value={conteudo || ''} onChange={setConteudo} modules={modules} className="h-[600px] mb-12 dark-quill" />
                </div>
              </div>
            </div>

            {/* Texto Auxiliar */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700">
                 <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4"><Quote size={20} className="text-indigo-500"/> Detalhes do Texto</h3>
                 <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Resumo (Lead)</label>
                    <textarea value={resumo} onChange={(e) => setResumo(e.target.value)} maxLength={200} className="w-full h-24 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white resize-none focus:ring-2 focus:ring-indigo-500/50 outline-none" placeholder="Breve descrição..."/>
                    <div className="text-right text-xs text-gray-400 mt-1">{resumo.length}/200</div>
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Frase de Destaque (Autor/Citação)</label>
                    <input type="text" value={autorFrase} onChange={(e) => setAutorFrase(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none" placeholder="Ex: 'Inovação é a chave' - CEO"/>
                 </div>
            </div>
          </div>

          {/* Direita: Configurações */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700">
               <h3 className="font-bold text-sm text-gray-800 dark:text-white mb-4 flex items-center gap-2"><ImageIcon size={18} className="text-indigo-500"/> Capa do Post</h3>
               <div onClick={() => fileInputRef.current?.click()} className={`relative w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${previewUrl ? 'border-indigo-500' : 'border-gray-300 hover:border-indigo-400 dark:border-gray-600'}`}>
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt="Capa" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(); }} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-600 backdrop-blur-md"><X size={16} /></button>
                      <div className="absolute bottom-0 left-0 w-full bg-black/60 text-white text-[10px] text-center py-1 backdrop-blur-sm">Corte Automático (16:9)</div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-500">Clique para upload</p>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
               </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700">
               <h3 className="font-bold text-sm text-gray-800 dark:text-white mb-4 flex items-center gap-2"><Tag size={18} className="text-indigo-500"/> Organização</h3>
               
               <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoria</label>
                  <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none">
                     <option value="">Selecione...</option>
                     <option value="Notícias">Notícias</option>
                     <option value="Comunicados">Comunicados</option>
                     <option value="Eventos">Eventos</option>
                     <option value="Tecnologia">Tecnologia</option>
                     <option value="RH">RH</option>
                  </select>
               </div>

               <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tags (Enter)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map(tag => (
                          <span key={tag} className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                              #{tag} <button type="button" onClick={()=>removeTag(tag)} className="hover:text-red-500"><X size={10}/></button>
                          </span>
                      ))}
                  </div>
                  <input type="text" value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={handleAddTag} placeholder="Adicionar tag..." className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"/>
               </div>

               <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                  <input type="checkbox" id="destaqueCheck" checked={destaque} onChange={e => setDestaque(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"/>
                  <label htmlFor="destaqueCheck" className="text-sm font-bold text-yellow-800 dark:text-yellow-200 cursor-pointer flex items-center gap-2"><Star size={16} fill={destaque ? "currentColor" : "none"}/> Destaque Manual</label>
               </div>
            </div>
          </div>
        </div>

        <style>{`
          .dark-quill .ql-toolbar { background-color: #f8fafc; border-color: #e2e8f0; border-top-left-radius: 1rem; border-top-right-radius: 1rem; }
          :is(.dark) .dark-quill .ql-toolbar { background-color: #1e293b; border-color: #334155; }
          :is(.dark) .dark-quill .ql-container { background-color: #0f172a; border-color: #334155; color: #e2e8f0; border-bottom-left-radius: 1rem; border-bottom-right-radius: 1rem; font-size: 1rem; }
          :is(.dark) .ql-stroke { stroke: #e2e8f0 !important; }
          :is(.dark) .ql-fill { fill: #e2e8f0 !important; }
          :is(.dark) .ql-picker { color: #e2e8f0 !important; }
        `}</style>
      </div>
    </ErrorFallback>
  );
};

export default BlogNovoPost;