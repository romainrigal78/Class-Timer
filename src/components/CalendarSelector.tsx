import React, { useState } from 'react';
import { 
  Calendar, 
  Globe, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import type { UserProfile } from '../services/keyauthService';

interface CalendarSelectorProps {
  user: UserProfile;
  onSelectionComplete: (selection: { year: string; track?: string; group?: string }) => void;
}

export const CalendarSelector: React.FC<CalendarSelectorProps> = ({ user, onSelectionComplete }) => {
  const [selectedYear, setSelectedYear] = useState<string>('A2');
  const [selectedTrack, setSelectedTrack] = useState<string>('International');
  const [selectedGroup, setSelectedGroup] = useState<string>('ITA');

  const needsTrack = selectedYear === 'A1' || selectedYear === 'A2';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSelectionComplete({
      year: selectedYear,
      track: needsTrack ? selectedTrack : undefined,
      group: needsTrack ? selectedGroup : undefined,
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-zinc-950 relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg rounded-3xl bg-zinc-900/80 border border-zinc-800/80 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-zinc-100 tracking-tight">
            Sélection du Calendrier
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Bienvenue <strong className="text-emerald-400">{user.username}</strong> ({user.school}) • Choisissez votre filière
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. Year Selection */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> 1. Choisissez votre année d'étude
            </label>
            <div className="grid grid-cols-5 gap-2">
              {['A1', 'A2', 'A3', 'A4', 'A5'].map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setSelectedYear(yr)}
                  className={`py-3 rounded-2xl border text-sm font-bold transition-all duration-200 ${
                    selectedYear === yr
                      ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md shadow-emerald-950/40 scale-105'
                      : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:bg-zinc-800/60 hover:text-zinc-200'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Track Selection (A1 or A2) */}
          {needsTrack && (
            <div className="animate-fadeIn">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" /> 2. Parcours d'enseignement
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'International', label: 'International track', icon: '🌍' },
                  { id: 'French', label: 'French track', icon: '🇫🇷' },
                ].map((tr) => (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() => setSelectedTrack(tr.id)}
                    className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all duration-200 ${
                      selectedTrack === tr.id
                        ? 'bg-blue-500/10 border-blue-500/40 text-blue-300 ring-1 ring-blue-500/30'
                        : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:bg-zinc-800/60 hover:text-zinc-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">{tr.icon}</span>
                      <span>{tr.label}</span>
                    </span>
                    {selectedTrack === tr.id && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Class Group Selection (ITA or ITB) */}
          {needsTrack && (
            <div className="animate-fadeIn">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" /> 3. Groupe de TD / Classe
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['ITA', 'ITB'].map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setSelectedGroup(grp)}
                    className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all duration-200 ${
                      selectedGroup === grp
                        ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300 ring-1 ring-indigo-500/30'
                        : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:bg-zinc-800/60 hover:text-zinc-200'
                    }`}
                  >
                    <span>Groupe {grp}</span>
                    {selectedGroup === grp && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all active:scale-95 pt-4"
          >
            <span>Accéder à l'emploi du temps</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </form>

        <p className="text-[11px] text-zinc-500 text-center mt-6 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>Sélection : <strong>{selectedYear}</strong> {needsTrack ? `• ${selectedTrack} • Groupe ${selectedGroup}` : ''}</span>
        </p>

      </div>
    </div>
  );
};
