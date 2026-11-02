import React from 'react';
import { 
  Wrench, 
  ArrowLeft, 
  Sparkles, 
  Lock, 
  AlertTriangle,
  Send
} from 'lucide-react';
import type { UserProfile } from '../services/keyauthService';

interface DevInProgressProps {
  user: UserProfile;
  selection: { year: string; track?: string; group?: string };
  onResetSelection: () => void;
}

export const DevInProgress: React.FC<DevInProgressProps> = ({
  user,
  selection,
  onResetSelection,
}) => {
  const [requestedAccess, setRequestedAccess] = React.useState(false);

  const handleRequestAccess = () => {
    setRequestedAccess(true);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-zinc-950 relative overflow-hidden">
      
      {/* Ambient Glows */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg rounded-3xl bg-zinc-900/80 border border-amber-500/30 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl text-center">
        
        {/* Animated Wrench Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-5 text-amber-400 shadow-inner">
          <Wrench className="w-8 h-8 animate-bounce" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">
          <AlertTriangle className="w-3.5 h-3.5" /> Développement en cours
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight mb-2">
          Filière bientôt disponible
        </h2>

        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto mb-6 leading-relaxed">
          La synchronisation automatique du calendrier pour la filière{' '}
          <strong className="text-amber-300 font-mono">
            {selection.year} {selection.track ? `• ${selection.track}` : ''} {selection.group ? `• Groupe ${selection.group}` : ''}
          </strong>{' '}
          est en cours de finalisation par l'équipe de développement.
        </p>

        {/* Current Access Notice */}
        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-xs text-left mb-6 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Sparkles className="w-4 h-4" /> Filière disponible actuellement :
          </div>
          <p className="text-zinc-300">
            Seule la filière <strong className="text-emerald-400">A2 • International track • Groupe ITA</strong> (EMLV) possède un emploi du temps synchro actif.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onResetSelection}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-950/30 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Basculer sur la filière A2 ITA</span>
          </button>

          <button
            onClick={handleRequestAccess}
            disabled={requestedAccess}
            className={`w-full py-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              requestedAccess
                ? 'bg-zinc-800 text-zinc-400 border-zinc-700 cursor-default'
                : 'bg-zinc-950/80 hover:bg-zinc-800/80 text-zinc-300 border-zinc-700/80 hover:text-white'
            }`}
          >
            {requestedAccess ? (
              <>
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Demande d'accès enregistrée pour {user.username} !</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-amber-400" />
                <span>Demander l'accès prioritaire pour cette filière</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
