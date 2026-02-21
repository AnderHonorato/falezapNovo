// frontend/src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contextos/AuthContext';
import { TemaProvider } from './contextos/TemaContexto';
import { ChatProvider } from './contextos/ChatContext';
import { SocketProvider } from './contextos/SocketContext';
import { ChatCacheProvider } from './componentes/ChatInterno/contextos/ChatCacheContext';
import AuthSocketListener from './componentes/AuthSocketListener';
import ProtectedRoute from './componentes/ProtectedRoute';
import ChatFlutuante from './componentes/ChatInterno/ChatFlutuante';

// Layout Principal
import MainLayout from './componentes/layout/MainLayout';

// Guardião Específico
import WhatsappRouteGuard from './componentes/auth/WhatsappRouteGuard';

// Páginas Públicas
import Login from './paginas/Login';
import CadastroEmpresa from './paginas/CadastroEmpresa';

// Páginas Privadas
import Dashboard from './paginas/Dashboard';
import Mensagens from './paginas/Mensagens';
import WhatsApp from './paginas/WhatsApp';
import EmpresasUsuarios from './paginas/EmpresasUsuarios';
import Empresas from './paginas/Empresas';
import Usuarios from './paginas/Usuarios';
import PermissoesUsuario from './paginas/PermissoesUsuario'; // ✅ 1. IMPORTAÇÃO ADICIONADA
import Analytics from './paginas/Analytics';
import CadastrarUsuario from './paginas/CadastrarUsuario';
import Equipe from './paginas/Equipe';
import PaginaBloqueio from './paginas/PaginaBloqueio';

// Blog
import BlogPrincipal from './paginas/blog/BlogPrincipal';
import BlogNovoPost from './paginas/blog/BlogNovoPost';
import BlogPost from './paginas/blog/BlogPost';

// Chat Interno - Admin
import AdminSolicitacoesAjuda from './paginas/AdminSolicitacoesAjuda';
import AdminVerAlertas from './paginas/AdminVerAlertas';

// Página Completa do Chat Interno
import ChatInternoFull from './paginas/ChatInternoFull';

// Página de Suporte
import Suporte from './paginas/Suporte';

// Página de IA e Aprendizado
import IAAprendizado from './paginas/IAAprendizado';

// Componente para renderizar o Chat apenas quando logado
function ChatWrapper() {
  const { usuario } = useAuth();
  return usuario ? <ChatFlutuante /> : null;
}

// GUARDA DE ROTAS POR CARGO (Personalizado)
function RoleGuard({ children, roles }) {
  const { usuario } = useAuth();
  if (usuario && !roles.includes(usuario.tipo)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider> 
          <TemaProvider>
            <ChatCacheProvider>
              <ChatProvider>
                <AuthSocketListener /> 
                
                <ChatWrapper />
                
                <Routes>
                  {/* Rotas Públicas */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/cadastro-empresa" element={<CadastroEmpresa />} />
                  
                  {/* Rotas Privadas */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <MainLayout />
                      </ProtectedRoute>
                    }
                  >
                    {/* Páginas Comuns */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    <Route path="/bloqueio" element={<PaginaBloqueio />} />

                    <Route path="/mensagens" element={<Mensagens />} />
                    <Route path="/empresas-usuarios" element={<EmpresasUsuarios />} />
                    
                    {/* Página com Guardião Específico */}
                    <Route
                      path="/whatsapp"
                      element={
                        <WhatsappRouteGuard>
                          <WhatsApp />
                        </WhatsappRouteGuard>
                      }
                    />
                    
                    {/* --- ROTAS DO BLOG --- */}
                    <Route path="/blog" element={<BlogPrincipal />} />
                    <Route path="/blog/post/:slug" element={<BlogPost />} />
                    <Route path="/blog/editar/:id" element={<ProtectedRoute><BlogNovoPost /></ProtectedRoute>} />
                    
                    {/* Rotas de Admin/Gestão */}
                    <Route path="/analytics" element={<ProtectedRoute requireAdmin><Analytics /></ProtectedRoute>} />
                    <Route path="/usuarios" element={<ProtectedRoute requireAdmin><Usuarios /></ProtectedRoute>} />
                    
                    {/* ✅ 2. ROTA DE PERMISSÕES ADICIONADA AQUI */}
                    <Route path="/usuarios/:id/permissoes" element={<ProtectedRoute requireAdmin><PermissoesUsuario /></ProtectedRoute>} />

                    <Route path="/usuarios/cadastrar" element={<ProtectedRoute requireAdmin><CadastrarUsuario /></ProtectedRoute>} />
                    <Route path="/equipe" element={<ProtectedRoute requireAdmin><Equipe /></ProtectedRoute>} />
                    
                    {/* Página de Suporte */}
                    <Route
                      path="/suporte"
                      element={
                        <ProtectedRoute requiredPermission="podeAcessarSuporte">
                          <Suporte />
                        </ProtectedRoute>
                      }
                    />
                    
                    {/* Página Completa do Chat Interno */}
                    <Route path="/chat-interno" element={<ChatInternoFull />} />
                    
                    {/* Rotas de Chat Interno - Admin */}
                    <Route
                      path="/chat-interno/solicitacoes"
                      element={
                        <ProtectedRoute requireAdmin>
                          <AdminSolicitacoesAjuda />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/chat-interno/alertas"
                      element={
                        <ProtectedRoute requireAdmin>
                          <AdminVerAlertas />
                        </ProtectedRoute>
                      }
                    />
                    {/* IA APRENDIZADO */}
                    <Route 
                      path="/ia-aprendizado" 
                      element={
                        <ProtectedRoute>
                          <RoleGuard roles={['OWNER', 'CEO', 'SUPORTE']}>
                            <IAAprendizado />
                          </RoleGuard>
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Rotas de Owner */}
                    <Route path="/empresas" element={<ProtectedRoute requireOwner><Empresas /></ProtectedRoute>} />
                    <Route path="/blog/novo" element={<ProtectedRoute requireOwner><BlogNovoPost /></ProtectedRoute>} />
                  
                    {/* Redirect padrão */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  </Route>
                  
                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </ChatProvider>
            </ChatCacheProvider>
          </TemaProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;