import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  Save, 
  Sparkles, 
  Link as LinkIcon, 
  FolderOpen, 
  Video, 
  Check
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  icsUrl: string;
  courseFolderUrl: string;
  zoomUrl: string;
  isDemo: boolean;
  onSave: (newSettings: {
    icsUrl: string;
    courseFolderUrl: string;
    zoomUrl: string;
    isDemo: boolean;
  }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  icsUrl: initialIcsUrl,
  courseFolderUrl: initialFolderUrl,
  zoomUrl: initialZoomUrl,
  isDemo: initialIsDemo,
  onSave,
}) => {
  const [icsUrl, setIcsUrl] = useState(initialIcsUrl);
  const [courseFolderUrl, setCourseFolderUrl] = useState(initialFolderUrl);
  const [zoomUrl, setZoomUrl] = useState(initialZoomUrl);
  const [isDemo, setIsDemo] = useState(initialIsDemo);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ icsUrl, courseFolderUrl, zoomUrl, isDemo });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleTestConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-800 text-emerald-400">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Configuration du Dashboard</h2>
              <p className="text-xs text-zinc-400">Flux ICS Outlook & Raccourcis personnalisés</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-5 mt-6">
          
          {/* Mode Démo Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-200">Activer le Mode Démo</p>
                <p className="text-[11px] text-zinc-400">Injecte des cours factices récents et à venir</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={isDemo} 
                onChange={(e) => setIsDemo(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* ICS URL Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              URL du flux Outlook (.ics)
            </label>
            <div className="relative">
              <input
                type="url"
                value={icsUrl}
                onChange={(e) => setIcsUrl(e.target.value)}
                placeholder="https://outlook.office365.com/owa/calendar/..."
                disabled={isDemo}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${
                  isDemo ? 'opacity-50 cursor-not-allowed border-zinc-800' : 'border-zinc-700/80 focus:border-emerald-500'
                }`}
              />
            </div>
            {isDemo && (
              <p className="text-[11px] text-amber-400/80 mt-1">
                Désactivez le Mode Démo pour utiliser votre URL ICS personnelle.
              </p>
            )}
          </div>

          {/* Course Folder URL */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-emerald-400" /> URL / Chemin du dossier de cours Desktop
            </label>
            <input
              type="text"
              value={courseFolderUrl}
              onChange={(e) => setCourseFolderUrl(e.target.value)}
              placeholder="file:///Users/romainrigal/Desktop"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-700/80 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Zoom Link URL */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-blue-400" /> Lien Zoom par défaut (Optionnel)
            </label>
            <input
              type="url"
              value={zoomUrl}
              onChange={(e) => setZoomUrl(e.target.value)}
              placeholder="https://devinci-online.zoom.us/j/123456789"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-700/80 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Test Confetti Animation */}
          <div className="pt-2 flex items-center justify-between border-t border-zinc-800">
            <button
              type="button"
              onClick={handleTestConfetti}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Tester l'animation de fin de cours</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-zinc-950 shadow-md shadow-emerald-950/30 transition-all active:scale-95"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" /> Enregistré !
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Enregistrer
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
