'use client';

import { ReactNode } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-teal-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-col flex-1 h-full">
        <Header onLogout={handleLogout} />

        <main className="flex-1 px-4 py-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
