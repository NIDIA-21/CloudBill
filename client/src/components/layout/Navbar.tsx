import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, Sparkles } from 'lucide-react';

interface NavbarProps {
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 flex items-center justify-between px-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          {title || 'Subscription Management'}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {user?.role === 'admin' && (
          <div className="hidden sm:flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-blue-200">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Makeathon 9.0 MVP Active</span>
          </div>
        )}

        <div className="h-8 w-px bg-slate-200 hidden sm:block" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <span className="text-sm font-semibold text-slate-800 block leading-tight">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-xs text-slate-500 capitalize">{user?.role}</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-sm">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </div>
        </div>
      </div>
    </header>
  );
};
