'use client';

import Link from 'next/link';
import { FC } from 'react';

const Sidebar: FC = () => {
  return (
    <aside className="w-64 h-screen bg-gray-800 text-white flex flex-col p-4">
      <h2 className="text-2xl font-bold mb-6">Mi App</h2>
      <nav className="flex flex-col gap-4">
        <Link href="/" className="hover:bg-gray-700 p-2 rounded">Inicio</Link>
        <Link href="/help" className="hover:bg-gray-700 p-2 rounded">Ayuda</Link>
        <Link href="/about" className="hover:bg-gray-700 p-2 rounded">Acerca de</Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
