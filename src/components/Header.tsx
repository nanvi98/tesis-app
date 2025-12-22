'use client';

import { FC } from 'react';
import { useRouter } from 'next/navigation';

const Header: FC = () => {
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
      router.push('/login');
    }
  };

  return (
    <header className="w-full h-16 bg-white shadow flex items-center justify-between px-6">
      <h1 className="text-xl font-bold">Mi App</h1>
      
      <div className="flex items-center gap-4">
        {/* Icono de usuario genérico */}
        <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold cursor-pointer">
          U
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
};

export default Header;
