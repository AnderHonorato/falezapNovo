// frontend/src/paginas/PaginaPrincipalDoChat.jsx (EXEMPLO DE PAI)
// Você deve ADAPTAR a lógica deste arquivo ao seu componente que renderiza o chat

import React, { useState, useEffect, useCallback } from 'react';
import CabecalhoChat from '../componentes/mensagens/CabecalhoChat';
import AreaMensagens from '../componentes/AreaMensagens';
import CaixaTexto from '../componentes/mensagens/CaixaTexto'; // Você já tem este
import api from '../servicos/api';
// (Importe seu componente de DatePicker aqui, ex: 'react-date-range')
// import { DateRangePicker } from 'react-date-range';
// import 'react-date-range/dist/styles.css'; // (CSS do DatePicker)
// import 'react-date-range/dist/theme/default.css'; // (CSS do DatePicker)

// (Assumindo que 'conversa' e 'usuario' são passados para esta página)
export default function PaginaPrincipalDoChat({ conversa, usuario }) {
  
  // --- ESTADO LEVANTADO (MOVIDO DE AREA_MENSAGENS) ---
  const [mensagens, setMensagens] = useState([]); // Mensagens exibidas
  const [allMensagens, setAllMensagens] = useState([]); // Cópia de backup
  const [loading, setLoading] = useState(true);

  // --- ESTADO DA BUSCA ---
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]); // Array de IDs
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  
  // --- ESTADO DO FILTRO DE DATA ---
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState([
    {
      startDate: null,
      endDate: null,
      key: 'selection'
    }
  ]);

  // Carrega as mensagens (agora no pai)
  const carregarMensagens = useCallback(() => {
    if (conversa?.id) {
      setLoading(true);
      handleSearchClose(); // Limpa busca ao trocar de conversa
      api.get(`/mensagens/conversa/${conversa.id}`)
        .then(response => {
          if (response.data.sucesso) {
            const msgs = response.data.mensagens || [];
            setMensagens(msgs);
            setAllMensagens(msgs); // Salva cópia original
          }
          setLoading(false);
        })
        .catch(error => {
          console.error('Erro ao carregar mensagens:', error);
          setLoading(false);
        });
    }
  }, [conversa?.id]); // A dependência está correta

  useEffect(() => {
    carregarMensagens();
  }, [carregarMensagens]);

  // --- FUNÇÕES DE BUSCA (PASSADAS PARA O CABEÇALHO) ---

  const handleSearchSubmit = (termo) => {
    setSearchTerm(termo);
    const resultados = [];
    // Filtra da lista de mensagens visíveis no momento
    mensagens.forEach(msg => {
      // Busca apenas em mensagens de texto
      if (msg.conteudo && (msg.tipo === 'TEXTO' || !msg.tipo)) {
        if (msg.conteudo.toLowerCase().includes(termo.toLowerCase())) {
          resultados.push(msg.id);
        }
      }
    });
    
    setSearchResults(resultados);
    setCurrentResultIndex(resultados.length > 0 ? 0 : -1);
  };

  const handleSearchNavigate = (direcao) => {
    if (searchResults.length === 0) return;
    
    let novoIndex = currentResultIndex;
    if (direcao === 'next') {
      novoIndex = (currentResultIndex + 1) % searchResults.length;
    } else if (direcao === 'prev') {
      novoIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
    }
    setCurrentResultIndex(novoIndex);
  };

  const handleSearchClose = () => {
    setSearchTerm('');
    setSearchResults([]);
    setCurrentResultIndex(-1);
  };
  
  // --- FUNÇÕES DE FILTRO DE DATA ---

  const handleToggleDatePicker = () => {
    // Se está abrindo, reseta os filtros de data
    if (!showDatePicker) {
        setMensagens(allMensagens); // Mostra tudo
        setDateRange([{ startDate: null, endDate: null, key: 'selection' }]);
    }
    setShowDatePicker(!showDatePicker);
  }
  
  const handleDateSelect = (ranges) => {
    // Exemplo: ranges = [{ startDate: Date, endDate: Date, key: 'selection' }]
    const selection = ranges.selection; // (Depende do seu DatePicker)
    setDateRange([selection]);
    
    // Filtra as mensagens originais pelo período
    const filtradas = allMensagens.filter(msg => {
      const msgDate = new Date(msg.criadaEm || msg.createdAt);
      // Ajusta para incluir o dia todo
      const startDate = selection.startDate;
      const endDate = selection.endDate;
      
      // Reseta a hora do Início para 00:00:00
      if (startDate) startDate.setHours(0, 0, 0, 0);
      // Reseta a hora do Fim para 23:59:59
      if (endDate) endDate.setHours(23, 59, 59, 999);

      if (startDate && endDate) {
         return msgDate >= startDate && msgDate <= endDate;
      }
      return true;
    });
    
    setMensagens(filtradas); // Atualiza a lista de mensagens visíveis
    handleSearchClose(); // Limpa a busca de texto
    // (Não fecha o picker, o usuário pode querer ajustar)
  };

  // ID da mensagem que deve ser destacada
  const highlightedId = searchResults[currentResultIndex] || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative' }}>
      <CabecalhoChat
        conversa={conversa}
        // ... (suas outras props, totalAnotacoes, onAbrirPerfil, etc) ...
        
        // Conectando a busca
        onSearchSubmit={handleSearchSubmit}
        onSearchNavigate={handleSearchNavigate}
        onSearchClose={handleSearchClose}
        searchResults={{ 
          current: currentResultIndex + 1, 
          total: searchResults.length 
        }}
        onToggleDatePicker={handleToggleDatePicker}
      />
      
      {/* Container para o DatePicker (ele precisa flutuar sobre o chat) */}
      {showDatePicker && (
        <div style={{ 
            position: 'absolute', 
            zIndex: 102, 
            top: 64, // Altura do seu cabeçalho
            right: 16,
            border: '1px solid #ccc',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {/* ✅ ADICIONE SEU COMPONENTE DateRangePicker AQUI 
            Exemplo:
            <DateRangePicker
               ranges={dateRange}
               onChange={handleDateSelect}
               months={1}
               direction="vertical"
               showDateDisplay={false}
            /> 
          */}
          <div style={{ padding: 20, background: 'white', color: 'black' }}>
             Seu DateRangePicker (ex: react-date-range) vai aqui.
          </div>
        </div>
      )}

      <AreaMensagens
        conversa={conversa}
        usuario={usuario}
        mensagens={mensagens} // ✅ Passando as mensagens filtradas
        loading={loading}
        searchTerm={searchTerm}    // ✅ Passando o termo da busca
        highlightedId={highlightedId} // ✅ Passando o ID destacado
        
        onReply={(msg) => console.log('Responder:', msg)}
        onDelete={(id) => console.log('Deletar:', id)}
      />
      
      <CaixaTexto 
        // ... (props do caixa de texto) ...
      />
    </div>
  );
}