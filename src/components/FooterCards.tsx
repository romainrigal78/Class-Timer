import React from 'react';
import { openDesktopFolder, type Course } from '../services/icsService';
import { MapPin, User, Clock, ChevronLeft, ChevronRight, CheckCircle2, Calendar, FolderOpen } from 'lucide-react';

interface FooterCardsProps {
  previousCourse: Course | null;
  nextCourse: Course | null;
}

export const FooterCards: React.FC<FooterCardsProps> = ({ previousCourse, nextCourse }) => {
  return (
    <div className="w-full max-w-4xl mx-auto my-6 px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      
      {/* Previous Course Card */}
      <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-5 backdrop-blur-xl hover:border-zinc-700/80 transition-all duration-200">
        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-zinc-800/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400">
              <ChevronLeft className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Cours Précédent
            </h3>
          </div>
          {previousCourse && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" /> Terminé
            </span>
          )}
        </div>

        {previousCourse ? (
          <div className="space-y-2.5">
            <h4 className="text-base font-semibold text-zinc-100 line-clamp-1">
              {previousCourse.cleanTitle || previousCourse.title}
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400 pt-1">
              <div className="flex items-center gap-1.5 bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/40">
                <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="truncate">{previousCourse.room}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/40">
                <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="truncate">
                  Fin à {previousCourse.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5 truncate">
                <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="truncate">{previousCourse.teacher}</span>
              </div>

              {previousCourse.matchedFolder && (
                <button
                  onClick={() => openDesktopFolder(previousCourse.matchedFolder)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 shrink-0 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 active:scale-95 transition-all"
                >
                  <FolderOpen className="w-3 h-3" /> {previousCourse.matchedFolder}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-zinc-500 italic">
            Aucun cours précédent aujourd'hui
          </div>
        )}
      </div>

      {/* Next Course Card */}
      <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-5 backdrop-blur-xl hover:border-zinc-700/80 transition-all duration-200">
        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-zinc-800/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-zinc-800 text-emerald-400">
              <ChevronRight className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Cours Suivant
            </h3>
          </div>
          {nextCourse && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              <Calendar className="w-3 h-3" /> À venir
            </span>
          )}
        </div>

        {nextCourse ? (
          <div className="space-y-2.5">
            <h4 className="text-base font-semibold text-zinc-100 line-clamp-1">
              {nextCourse.cleanTitle || nextCourse.title}
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400 pt-1">
              <div className="flex items-center gap-1.5 bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/40">
                <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">{nextCourse.room}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/40">
                <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">
                  Reprise à {nextCourse.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5 truncate">
                <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="truncate">{nextCourse.teacher}</span>
              </div>

              {nextCourse.matchedFolder && (
                <button
                  onClick={() => openDesktopFolder(nextCourse.matchedFolder)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 shrink-0 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 active:scale-95 transition-all"
                >
                  <FolderOpen className="w-3 h-3" /> {nextCourse.matchedFolder}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-zinc-500 italic">
            Aucun cours suivant au programme
          </div>
        )}
      </div>

    </div>
  );
};
