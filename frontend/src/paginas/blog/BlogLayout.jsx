import React, { useState, useEffect } from 'react';
import { Search, Plus, TrendingUp, Info, CalendarDays, Bookmark, ExternalLink, ArrowUp } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BlogLayout = ({ 
  children, termoBusca, setTermoBusca, abas, abaAtiva, setAbaAtiva, 
  showCreateBtn, onCreate, sidebarContent 
}) => {
  
  const navigate = useNavigate();
  const location = useLocation();
  const [showScroll, setShowScroll] = useState(false);

  // Abas padrão
  const abasPadrao = [
    { id: 'noticias', label: 'Notícias' }, 
    { id: 'comunicados', label: 'Comunicados' }, 
    { id: 'eventos', label: 'Eventos' }
  ];

  const abasParaExibir = abas || abasPadrao;

  const handleAbaClick = (id) => {
    if (location.pathname === '/blog' && setAbaAtiva) {
        setAbaAtiva(id);
    } else {
        navigate('/blog', { state: { abaInicial: id } });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
        const scrollY = window.scrollY || document.documentElement.scrollTop || document.querySelector('main')?.scrollTop || 0;
        setShowScroll(scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    const mainContainer = document.querySelector('main');
    if (mainContainer) mainContainer.addEventListener('scroll', handleScroll);

    return () => {
        window.removeEventListener('scroll', handleScroll);
        if (mainContainer) mainContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const mainContainer = document.querySelector('main');
      if (mainContainer) mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const linksPadrao = [
    { id: 1, title: 'Agenda Corporativa', sub: 'Eventos', color: 'blue', icon: CalendarDays },
    { id: 2, title: 'Manuais e Normas', sub: 'Docs', color: 'green', icon: Bookmark },
    { id: 3, title: 'Portal do Colaborador', sub: 'RH', color: 'purple', icon: ExternalLink }
  ];

  return (
    <div className="min-h-full bg-[#e2e4e7] dark:bg-[#0b0f19] transition-colors font-sans relative">
      
      {/* HEADER STICKY */}
      <div className="sticky top-0 z-30 flex justify-center w-full pb-6 pt-2 pointer-events-none">
        <header className="w-full max-w-5xl bg-[#fdfbf7]/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-full shadow-lg px-4 py-2.5 flex items-center justify-between gap-4 transition-all pointer-events-auto">
            
            <div className="flex items-center gap-3 pl-2 cursor-pointer" onClick={() => navigate('/blog')}>
                <div className="bg-indigo-600 p-2 rounded-full text-white shadow-md">
                    <TrendingUp size={18} />
                </div>
                <h1 className="text-sm font-black tracking-tight text-gray-800 dark:text-white hidden sm:block uppercase">
                  Central de Notícias
                </h1>
            </div>

            <nav className="hidden md:flex items-center gap-1 bg-gray-200/50 dark:bg-gray-900/50 p-1 rounded-full">
                {abasParaExibir.map((aba) => (
                <button
                    key={aba.id}
                    onClick={() => handleAbaClick(aba.id)}
                    className={`px-4 py-1.5 rounded-full text-[10px] uppercase font-bold transition-all ${
                    abaAtiva === aba.id 
                        ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm scale-105' 
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    {aba.label}
                </button>
                ))}
            </nav>

            <div className="flex items-center gap-2 pr-1">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                    <input 
                        type="text" 
                        placeholder="Buscar..." 
                        value={termoBusca || ''} 
                        onChange={e=>setTermoBusca && setTermoBusca(e.target.value)} 
                        className="w-28 sm:w-48 pl-9 pr-3 py-1.5 bg-[#f0f0f0] dark:bg-gray-900 border-none rounded-full text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none dark:text-white transition-all" 
                    />
                </div>
                {showCreateBtn && (
                    <button onClick={onCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-md transition-all hover:scale-110 active:scale-95" title="Criar Post">
                        <Plus size={16} />
                    </button>
                )}
            </div>
        </header>
      </div>

      <div className="max-w-[1400px] mx-auto px-2 lg:px-6 flex flex-col lg:flex-row gap-6 items-start pb-20">
        <main className="flex-1 min-w-0 w-full">
          {children}
        </main>
        
        <aside className="w-full lg:w-80 flex flex-col gap-6 sticky top-24">
          {sidebarContent ? sidebarContent : (
            <div className="bg-[#fdfbf7] dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                    <Info size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-bold text-sm text-gray-800 dark:text-white">Acesso Rápido</h3>
                </div>
                <div className="space-y-3">
                  {linksPadrao.map((l) => (
                    <div key={l.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600 group">
                        <div className={`p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400`}>
                          <l.icon size={16}/>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-700 dark:text-gray-200">{l.title}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500">{l.sub}</p>
                        </div>
                    </div>
                  ))}
                </div>
            </div>
          )}
        </aside>
      </div>

      {showScroll && (
        <button 
            onClick={scrollToTop} 
            className="fixed bottom-8 right-8 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl transition-all z-50 animate-bounce cursor-pointer border-2 border-white dark:border-gray-800"
            title="Voltar ao topo"
        >
            <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
};

export default BlogLayout;