import React, { useState, useRef, useEffect } from 'react';
import { 
  FolderOpen, 
  Video, 
  CheckCircle2, 
  BookOpen, 
  Settings, 
  RefreshCw, 
  Sparkles, 
  ExternalLink, 
  CalendarCheck,
  Menu,
  X,
  ChevronRight,
  Terminal
} from 'lucide-react';
import { openDesktopFolder } from '../services/icsService';

interface TopBarProps {
  courseFolderUrl: string;
  matchedFolder?: string;
  zoomUrl?: string;
  isDemo: boolean;
  isLoading: boolean;
  lastSyncedAt?: Date;
  onRefresh: () => void;
  onOpenSettings: () => void;
  onOpenGame?: () => void;
  onOpenDebug?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  matchedFolder,
  zoomUrl,
  isDemo,
  isLoading,
  lastSyncedAt,
  onRefresh,
  onOpenSettings,
  onOpenGame,
  onOpenDebug,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasZoom = Boolean(zoomUrl && zoomUrl.trim().length > 0);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header className="w-full bg-zinc-900/60 backdrop-blur-xl border-b border-zinc-800/80 sticky top-0 z-40 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand / Logo & Sync Status */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-800/90 border border-zinc-700/60 shadow-inner group">
            <span className="text-emerald-400 font-black text-sm tracking-widest font-mono">DV</span>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isDemo ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isDemo ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">
                Emploi du Temps
              </h1>
              {isDemo && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sparkles className="w-3 h-3" /> Mode Démo
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 flex items-center gap-1">
              <span>{lastSyncedAt ? `Mis à jour à ${lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Flux ICS Sync'}</span>
              <button 
                onClick={onRefresh}
                disabled={isLoading}
                title="Actualiser les données"
                className="hover:text-zinc-200 transition-colors p-0.5 rounded focus:outline-none cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </p>
          </div>
        </div>

        {/* Action Buttons: Only Quizz, Émargement and Sandwich Menu directly visible */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          
          {/* 1. Quick jump to Quizz Agenda */}
          <button
            onClick={() => {
              const el = document.getElementById('agenda-evaluations');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            title="Consulter l'agenda des quizz & interros"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800/90 hover:bg-zinc-700/90 text-amber-400 border border-amber-500/30 transition-all duration-200 active:scale-95 shadow-sm cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4 text-amber-400" />
            <span>Quizz</span>
          </button>

          {/* 2. De Vinci Presences / Émargement */}
          <a
            href="https://my.devinci.fr/student/presences/"
            target="_blank"
            rel="noopener noreferrer"
            title="Émargement De Vinci"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-md shadow-emerald-950/20 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Émargement</span>
          </a>

          {/* 3. Sandwich Menu Dropdown (Housing all other items & the new game) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              title="Menu Outils & Jeux"
              className={`p-2 rounded-xl border transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center relative ${
                isMenuOpen 
                  ? 'bg-zinc-800 text-white border-zinc-600' 
                  : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700/70'
              }`}
            >
              {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              {/* Badge for the new game */}
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
              </span>
            </button>

            {/* Sandwich Popover Panel */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800 shadow-2xl p-2.5 space-y-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                
                {/* Featured: Prof ou Comptable Game Button */}
                {onOpenGame && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenGame();
                    }}
                    className="w-full p-3 rounded-xl bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-emerald-500/20 hover:from-indigo-500/30 hover:to-emerald-500/30 border border-indigo-500/40 text-left transition-all active:scale-[0.98] group cursor-pointer shadow-lg shadow-indigo-950/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🎓</span>
                        <span className="text-xs font-bold text-zinc-100 group-hover:text-indigo-300 transition-colors">
                          Prof ou Comptable ?
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500 text-white shadow-sm">
                        Jeu
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                      Devinez qui enseigne à De Vinci et qui est auditeur sur LinkedIn !
                    </p>
                  </button>
                )}

                <div className="h-px bg-zinc-800/80 my-1"></div>

                {/* Folder Opener */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    openDesktopFolder(matchedFolder);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-zinc-800/80 transition-colors text-xs text-zinc-200 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <FolderOpen className="w-4 h-4 text-emerald-400" />
                    <span>Dossier Cours</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono truncate max-w-[120px]">
                    {matchedFolder ? `📁 ${matchedFolder}` : 'Desktop'}
                  </span>
                </button>

                {/* Zoom Link */}
                {hasZoom ? (
                  <a
                    href={zoomUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-blue-500/15 transition-colors text-xs text-blue-400 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Video className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold">Rejoindre Zoom</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>
                ) : (
                  <div className="w-full flex items-center justify-between p-2 rounded-xl text-left text-xs text-zinc-500 opacity-60 cursor-not-allowed">
                    <div className="flex items-center gap-2.5">
                      <Video className="w-4 h-4 text-zinc-600" />
                      <span>Pas de Zoom requis</span>
                    </div>
                  </div>
                )}

                {/* Learning De Vinci */}
                <a
                  href="https://learning.devinci.fr/my/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-zinc-800/80 transition-colors text-xs text-zinc-300 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    <span>Learning De Vinci</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                </a>

                {/* Manual Sync */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onRefresh();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-zinc-800/80 transition-colors text-xs text-zinc-300 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <RefreshCw className={`w-4 h-4 text-zinc-400 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
                    <span>Actualiser le planning</span>
                  </div>
                </button>

                <div className="h-px bg-zinc-800/80 my-1"></div>

                {/* Debug & Terminal */}
                {onOpenDebug && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenDebug();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-zinc-800/80 transition-colors text-xs text-amber-400 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Terminal className="w-4 h-4 text-amber-400" />
                      <span className="font-semibold">Debug & Terminal</span>
                    </div>
                    <span className="text-[10px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded">
                      JSON + CLI
                    </span>
                  </button>
                )}

                {/* Settings */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-zinc-800/80 transition-colors text-xs text-zinc-300 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-zinc-400" />
                    <span>Paramètres & Flux ICS</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                </button>

              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
