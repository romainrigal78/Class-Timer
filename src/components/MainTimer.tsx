import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Clock, 
  MapPin, 
  User, 
  Coffee, 
  Cigarette, 
  Sparkles, 
  CheckCircle,
  CalendarDays,
  PlayCircle,
  FolderOpen
} from 'lucide-react';
import { openDesktopFolder, type Course } from '../services/icsService';

interface MainTimerProps {
  ongoingCourse: Course | null;
  nextCourse: Course | null;
  previousCourse: Course | null;
  currentTime: Date;
}

export const MainTimer: React.FC<MainTimerProps> = ({
  ongoingCourse,
  nextCourse,
  currentTime,
}) => {
  const confettiFiredRef = useRef<boolean>(false);

  // Determine State
  const nowMs = currentTime.getTime();
  const isOngoing = Boolean(ongoingCourse);
  
  const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const isBreak = !isOngoing && Boolean(nextCourse) && isSameDay(nextCourse!.start, currentTime);

  // Time calculations
  let remainingMs = 0;
  let totalMs = 1;
  let progressPercentage = 0;

  if (isOngoing && ongoingCourse) {
    const startMs = ongoingCourse.start.getTime();
    const endMs = ongoingCourse.end.getTime();
    totalMs = Math.max(1, endMs - startMs);
    remainingMs = Math.max(0, endMs - nowMs);
    const elapsedMs = Math.max(0, nowMs - startMs);
    progressPercentage = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
  } else if (isBreak && nextCourse) {
    remainingMs = Math.max(0, nextCourse.start.getTime() - nowMs);
  }

  // Confetti trigger
  useEffect(() => {
    if (isOngoing && remainingMs <= 1000 && remainingMs > 0 && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'],
        });
      } catch (err) {
        console.error('Confetti trigger error:', err);
      }
    }

    if (remainingMs > 1000) {
      confettiFiredRef.current = false;
    }
  }, [isOngoing, remainingMs]);

  // Helper to format ms to HH:MM:SS
  const formatTimeDigital = (ms: number): { hours: string; minutes: string; seconds: string } => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    return {
      hours: h.toString().padStart(2, '0'),
      minutes: m.toString().padStart(2, '0'),
      seconds: s.toString().padStart(2, '0'),
    };
  };

  const timerFormatted = formatTimeDigital(remainingMs);

  return (
    <div className="w-full max-w-4xl mx-auto my-6 px-4">
      {/* State 1: Ongoing Class */}
      {isOngoing && ongoingCourse && (
        <div className="relative overflow-hidden rounded-3xl bg-zinc-900/80 border border-zinc-800 p-6 sm:p-10 shadow-2xl backdrop-blur-2xl animate-glow-emerald transition-all duration-500">
          
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Status Header */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Cours en cours
              </span>
            </div>

            <div className="text-xs text-zinc-400 font-medium flex items-center gap-1.5 bg-zinc-800/60 px-3 py-1 rounded-full border border-zinc-700/50">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>
                {ongoingCourse.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {ongoingCourse.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Giant Monospace Timer */}
          <div className="text-center my-6">
            <p className="text-xs uppercase tracking-widest text-zinc-400 mb-2 font-mono">
              Temps restant avant la sonnerie
            </p>
            <div className="font-mono tabular-nums text-5xl sm:text-7xl md:text-8xl font-black text-zinc-100 tracking-tight leading-none drop-shadow-lg">
              <span className="text-zinc-100">{timerFormatted.hours}</span>
              <span className="text-emerald-500 font-light mx-1 animate-pulse">:</span>
              <span className="text-zinc-100">{timerFormatted.minutes}</span>
              <span className="text-emerald-500 font-light mx-1 animate-pulse">:</span>
              <span className="text-emerald-400">{timerFormatted.seconds}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full my-6">
            <div className="flex justify-between items-center text-xs text-zinc-400 mb-2 font-medium">
              <span>Progression du cours</span>
              <span className="text-emerald-400 font-mono font-semibold">{progressPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700/50 p-0.5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-1000 ease-out shadow-sm shadow-emerald-500/50"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Course Details Card */}
          <div className="mt-8 pt-6 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="flex items-start gap-3 bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/60">
              <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Matière</p>
                <p className="text-sm font-semibold text-zinc-100 line-clamp-1">{ongoingCourse.cleanTitle || ongoingCourse.title}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/60">
              <MapPin className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Salle</p>
                <p className="text-sm font-semibold text-zinc-100 line-clamp-1">{ongoingCourse.room}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/60">
              <User className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Professeur</p>
                <p className="text-sm font-semibold text-zinc-100 line-clamp-1">{ongoingCourse.teacher}</p>
              </div>
            </div>
          </div>

          {/* Smart Desktop Folder Direct Shortcut */}
          {ongoingCourse.matchedFolder && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-300 font-medium">
                <FolderOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Dossier Desktop associé : <strong className="text-white">{ongoingCourse.matchedFolder}</strong></span>
              </div>
              <button
                onClick={() => openDesktopFolder(ongoingCourse.matchedFolder)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 transition-all active:scale-95 shadow-sm"
              >
                Ouvrir dans le Finder
              </button>
            </div>
          )}

        </div>
      )}

      {/* State 2: Pause Clope (Break Mode) */}
      {isBreak && nextCourse && (
        <div className="relative overflow-hidden rounded-3xl bg-zinc-900/80 border border-amber-500/30 p-6 sm:p-10 shadow-2xl backdrop-blur-2xl animate-glow-amber transition-all duration-500">
          
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header Badge */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                <Cigarette className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  Pause Clope / Pause inter-cours
                </span>
              </div>
            </div>

            <div className="text-xs text-amber-300/80 font-medium flex items-center gap-1.5 bg-amber-950/40 px-3 py-1 rounded-full border border-amber-500/20">
              <Coffee className="w-3.5 h-3.5 text-amber-400" />
              <span>Reprise à {nextCourse.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Countdown to Next Course */}
          <div className="text-center my-6">
            <p className="text-xs uppercase tracking-widest text-amber-400/80 mb-2 font-mono">
              Reprise du prochain cours dans
            </p>
            <div className="font-mono tabular-nums text-5xl sm:text-7xl md:text-8xl font-black text-amber-100 tracking-tight leading-none drop-shadow-lg">
              <span className="text-amber-100">{timerFormatted.hours}</span>
              <span className="text-amber-500 font-light mx-1 animate-pulse">:</span>
              <span className="text-amber-100">{timerFormatted.minutes}</span>
              <span className="text-amber-500 font-light mx-1 animate-pulse">:</span>
              <span className="text-amber-400">{timerFormatted.seconds}</span>
            </div>
          </div>

          {/* Next Course Summary Banner */}
          <div className="mt-8 p-4 rounded-2xl bg-zinc-950/60 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                <PlayCircle className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-amber-400">Prochain cours de la journée</p>
                <h3 className="text-base font-bold text-zinc-100">{nextCourse.cleanTitle || nextCourse.title}</h3>
                <p className="text-xs text-zinc-400 flex flex-wrap items-center gap-3 mt-1">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-amber-400" /> {nextCourse.room}</span>
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-zinc-400" /> {nextCourse.teacher}</span>
                  {nextCourse.matchedFolder && (
                    <span className="flex items-center gap-1 text-emerald-400 font-medium"><FolderOpen className="w-3.5 h-3.5" /> 📁 {nextCourse.matchedFolder}</span>
                  )}
                </p>
              </div>
            </div>

            {nextCourse.matchedFolder && (
              <button
                onClick={() => openDesktopFolder(nextCourse.matchedFolder)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition-all active:scale-95 shrink-0"
              >
                Ouvrir dans le Finder
              </button>
            )}
          </div>

        </div>
      )}

      {/* State 3: No Class / End of Day */}
      {!isOngoing && !isBreak && (
        <div className="relative overflow-hidden rounded-3xl bg-zinc-900/60 border border-zinc-800 p-8 sm:p-12 text-center backdrop-blur-2xl shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-inner">
            <CheckCircle className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight mb-2">
            Aucun cours en cours
          </h2>

          <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6 leading-relaxed">
            {nextCourse 
              ? `Journée terminée ou pause prolongée. Votre prochain cours débutera le ${nextCourse.start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à ${nextCourse.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
              : 'Aucun cours n\'est programmé pour aujourd\'hui. Profitez de votre temps libre !'}
          </p>

          {nextCourse && (
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-xs text-zinc-300">
              <CalendarDays className="w-4 h-4 text-emerald-400" />
              <span>Prochain rendez-vous : <strong className="text-zinc-100">{nextCourse.cleanTitle || nextCourse.title}</strong> ({nextCourse.room})</span>
              {nextCourse.matchedFolder && (
                <button 
                  onClick={() => openDesktopFolder(nextCourse.matchedFolder)}
                  className="ml-2 text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5" /> 📁 {nextCourse.matchedFolder}
                </button>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
