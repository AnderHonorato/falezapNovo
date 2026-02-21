import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, FileText, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { useTema } from '../../contextos/TemaContexto';
import api from '../../servicos/api';
import toast from 'react-hot-toast';

export default function ModalExportarRelatorio({ isOpen, onClose }) {
  const { tema, temaEscuro } = useTema();
  const [loading, setLoading] = useState(false);
  
  // Filtros Completos
  const [filtros, setFiltros] = useState({
      status: 'todos',
      cargo: 'todos',
      dataInicio: new Date().toISOString().split('T')[0],
      dataFim: new Date().toISOString().split('T')[0]
  });

  if (!isOpen) return null;

  const handleDownload = async (formato) => {
    setLoading(true);
    const toastId = toast.loading(`Gerando ${formato.toUpperCase()}...`);

    try {
      const endpoint = formato === 'pdf' 
        ? '/relatorios/equipe/exportar/pdf' 
        : '/relatorios/equipe/exportar';

      const response = await api.get(endpoint, {
        params: filtros,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      const ext = formato === 'pdf' ? 'pdf' : 'xlsx';
      link.setAttribute('download', `Relatorio_Equipe_${date}.${ext}`);
      
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Download concluído!', { id: toastId });
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao baixar relatório.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[100] animate-fade-in backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[101] rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in flex flex-col overflow-hidden border"
        style={{ backgroundColor: temaEscuro ? '#111827' : '#ffffff', borderColor: tema.borda }}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b" style={{ backgroundColor: temaEscuro ? '#1f2937' : '#f9fafb', borderColor: tema.borda }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight" style={{ color: tema.texto }}>Exportar Relatório</h2>
              <p className="text-xs opacity-70" style={{ color: tema.textoSecundario }}>Selecione os filtros e o formato</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" style={{ color: tema.textoSecundario }} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          
          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-xs uppercase font-bold mb-1.5 opacity-70" style={{ color: tema.texto }}>Data Início</label>
                  <div className="relative">
                      <CalendarIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" style={{ color: tema.texto }} />
                      <input 
                          type="date" 
                          value={filtros.dataInicio}
                          onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
                          className="w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                          style={{ backgroundColor: temaEscuro ? '#374151' : '#f9fafb', borderColor: tema.borda, color: tema.texto }}
                      />
                  </div>
              </div>
              <div>
                  <label className="block text-xs uppercase font-bold mb-1.5 opacity-70" style={{ color: tema.texto }}>Data Fim</label>
                  <div className="relative">
                      <CalendarIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" style={{ color: tema.texto }} />
                      <input 
                          type="date" 
                          value={filtros.dataFim}
                          onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
                          className="w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                          style={{ backgroundColor: temaEscuro ? '#374151' : '#f9fafb', borderColor: tema.borda, color: tema.texto }}
                      />
                  </div>
              </div>
          </div>

          <hr style={{ borderColor: tema.borda }} />

          {/* Filtro Status */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: tema.texto }}>Filtrar por Status</label>
            <div className="grid grid-cols-3 gap-2">
              {['todos', 'ATIVO', 'INATIVO'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFiltros({...filtros, status: opt})}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all capitalize ${
                    filtros.status === opt 
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' 
                    : 'bg-transparent border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  style={filtros.status !== opt ? { color: tema.textoSecundario } : {}}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro Cargo */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: tema.texto }}>Filtrar por Cargo</label>
            <select
              value={filtros.cargo}
              onChange={(e) => setFiltros({...filtros, cargo: e.target.value})}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              style={{ 
                backgroundColor: temaEscuro ? '#374151' : '#f9fafb', 
                borderColor: tema.borda,
                color: tema.texto 
              }}
            >
              <option value="todos">Todos os Cargos</option>
              <option value="OWNER">Fundador / Owner</option>
              <option value="ADMIN">Gerente / Admin</option>
              <option value="COLABORADOR">Colaborador</option>
              <option value="SUPORTE">Suporte</option>
            </select>
          </div>
        </div>

        {/* Footer com Botões de Download */}
        <div className="p-4 border-t flex gap-3 bg-gray-50 dark:bg-gray-800/50" style={{ borderColor: tema.borda }}>
          <button 
            onClick={() => handleDownload('excel')}
            disabled={loading}
            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            Excel
          </button>
          
          <button 
            onClick={() => handleDownload('pdf')}
            disabled={loading}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            PDF
          </button>
        </div>
      </div>
    </>
  );
}