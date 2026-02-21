import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../componentes/Sidebar'; 

const Blog = () => {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full">
        {/* Header Fixo */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-8 justify-between shrink-0 z-10">
           <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
             Blog Interno
           </h1>
        </header>

        {/* Área de Conteúdo com Scroll */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Blog;