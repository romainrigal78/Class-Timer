import React, { useState } from 'react';
import { openDesktopFolder, getLocalDateStr, type Course } from '../services/icsService';
import { 
  Calendar, 
  MapPin, 
  User, 
  FolderOpen, 
  Video, 
  Search, 
  CheckCircle2
} from 'lucide-react';

interface ScheduleTimelineProps {
  courses: Course[];
  ongoingCourse: Course | null;
  currentTime: Date;
}

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({
  courses,
  ongoingCourse,
  currentTime,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return getLocalDateStr(currentTime);
  });

  // Group courses by Local Date
  const availableDates = Array.from(
    new Set(courses.map((c) => getLocalDateStr(c.start)))
  ).sort();

  // Filter courses for the selected date and search term
  const filteredCourses = courses.filter((c) => {
    const courseDate = getLocalDateStr(c.start);
    const matchesDate = courseDate === selectedDate;
    
    if (!searchTerm.trim()) return matchesDate;

    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      c.cleanTitle.toLowerCase().includes(term) ||
      c.teacher.toLowerCase().includes(term) ||
      c.room.toLowerCase().includes(term) ||
      (c.matchedFolder && c.matchedFolder.toLowerCase().includes(term));

    return matchesSearch;
  });

  const nowMs = currentTime.getTime();
  const todayStr = getLocalDateStr(currentTime);

  return (
    <div className="w-full max-w-4xl mx-auto my-8 px-4">
      <div className="rounded-3xl bg-zinc-900/70 border border-zinc-800/80 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
                Emploi du Temps Complet
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
                {courses.length} cours
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Consultez tous vos cours et ouvrez directement vos dossiers Desktop
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {selectedDate !== todayStr && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-bold border border-emerald-500/30 transition-all shrink-0"
              >
                Aujourd'hui
              </button>
            )}

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Matière, prof, salle..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Date Selector Navigation Bar */}
        <div className="flex items-center gap-2 my-6 overflow-x-auto pb-2 scrollbar-thin">
          {availableDates.slice(0, 30).map((dateStr) => {
            const dateObj = new Date(`${dateStr}T12:00:00`);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`flex flex-col items-center min-w-[75px] py-2 px-3 rounded-xl border text-xs transition-all duration-200 shrink-0 ${
                  isSelected
                    ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-bold shadow-md shadow-emerald-950/30'
                    : isToday
                    ? 'bg-zinc-800/90 text-emerald-400 border-emerald-500/40 font-semibold ring-1 ring-emerald-500/30'
                    : 'bg-zinc-950/60 text-zinc-400 border-zinc-800/80 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                <span className="text-[10px] uppercase font-mono tracking-wider opacity-80">
                  {dateObj.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </span>
                <span className="text-sm font-bold">
                  {dateObj.getDate()} {dateObj.toLocaleDateString('fr-FR', { month: 'short' })}
                </span>
              </button>
            );
          })}
        </div>

        {/* Course List */}
        <div className="space-y-3 mt-4">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => {
              const isCurrent = ongoingCourse?.id === course.id;
              const isPast = course.end.getTime() <= nowMs;
              const isFuture = course.start.getTime() > nowMs;

              return (
                <div
                  key={course.id}
                  className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 border transition-all duration-300 ${
                    isCurrent
                      ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-950/20 animate-glow-emerald'
                      : isPast
                      ? 'bg-zinc-950/40 border-zinc-800/60 opacity-80 hover:opacity-100'
                      : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    {/* Time & Title */}
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl border shrink-0 text-center font-mono ${
                        isCurrent
                          ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-bold'
                          : isPast
                          ? 'bg-zinc-900 text-zinc-500 border-zinc-800'
                          : 'bg-zinc-800 text-emerald-400 border-zinc-700'
                      }`}>
                        <div className="text-xs font-bold">{course.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-[10px] opacity-75">{course.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-zinc-100">
                            {course.cleanTitle}
                          </h3>
                          
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 animate-pulse">
                              En cours
                            </span>
                          )}

                          {isPast && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500 bg-zinc-800/60 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Terminé
                            </span>
                          )}

                          {isFuture && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                              À venir
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 mt-1.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-zinc-500" /> {course.room}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-zinc-500" /> {course.teacher}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions & Links */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {course.zoomUrl && (
                        <a
                          href={course.zoomUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold border border-blue-500/30 transition-all"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Zoom</span>
                        </a>
                      )}

                      {course.matchedFolder ? (
                        <button
                          onClick={() => openDesktopFolder(course.matchedFolder)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition-all active:scale-95 cursor-pointer"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>📁 {course.matchedFolder}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => openDesktopFolder()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-400 text-xs font-medium border border-zinc-700/50 transition-all cursor-pointer"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>Bureau</span>
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-zinc-500">
              Aucun cours trouvé pour cette date. Cliquez sur un autre jour ci-dessus.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
