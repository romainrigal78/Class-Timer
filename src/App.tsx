import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { MainTimer } from './components/MainTimer';
import { FooterCards } from './components/FooterCards';
import { ScheduleTimeline } from './components/ScheduleTimeline';
import { SettingsModal } from './components/SettingsModal';
import { MusicPlayer } from './components/MusicPlayer';
import { AssessmentAgenda } from './components/AssessmentAgenda';
import { ProfOrAccountantGame } from './components/ProfOrAccountantGame';
import { DebugModal } from './components/DebugModal';

import { 
  type Course, 
  generateDemoCourses, 
  fetchAndParseICS,
  getLocalExtractedCourses,
  DESKTOP_ROOT_PATH 
} from './services/icsService';
import { Calendar } from 'lucide-react';

const DEFAULT_ICS_URL = 'https://outlook.office365.com/owa/calendar/7f1f6a14e5da4edbbe237c52d2513ce3@edu.devinci.fr/16dc32fcbb95471193d28303e8bbd8bf3060439431801066347/calendar.ics';

const STORAGE_KEY_ICS_URL = 'univ_dashboard_ics_url';
const STORAGE_KEY_FOLDER_URL = 'univ_dashboard_folder_url';
const STORAGE_KEY_ZOOM_URL = 'univ_dashboard_zoom_url';
const STORAGE_KEY_IS_DEMO = 'univ_dashboard_is_demo';

export const App: React.FC = () => {
  // Live Clock Ticker
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Configuration State
  const [icsUrl, setIcsUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_ICS_URL) || DEFAULT_ICS_URL;
  });
  const [courseFolderUrl, setCourseFolderUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_FOLDER_URL) || `file://${DESKTOP_ROOT_PATH}`;
  });
  const [customZoomUrl, setCustomZoomUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_ZOOM_URL) || '';
  });
  const [isDemo, setIsDemo] = useState<boolean>(() => {
    const savedDemo = localStorage.getItem(STORAGE_KEY_IS_DEMO);
    return savedDemo !== null ? savedDemo === 'true' : false;
  });

  // App Data & Modals
  const [courses, setCourses] = useState<Course[]>(() => getLocalExtractedCourses());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | undefined>(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isGameOpen, setIsGameOpen] = useState<boolean>(false);
  const [isDebugOpen, setIsDebugOpen] = useState<boolean>(false);

  // Global Keyboard Shortcut: Command+D or Ctrl+D to toggle Debug Tools
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsDebugOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Tick clock every 1 second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch or Load Courses
  const loadScheduleData = useCallback(async () => {
    setIsLoading(true);

    if (isDemo) {
      setCourses(generateDemoCourses());
      setLastSyncedAt(new Date());
      setIsLoading(false);
      return;
    }

    try {
      const fetchedCourses = await fetchAndParseICS(icsUrl);
      if (fetchedCourses && fetchedCourses.length > 0) {
        setCourses(fetchedCourses);
      } else {
        setCourses(getLocalExtractedCourses());
      }
      setLastSyncedAt(new Date());
    } catch {
      setCourses(getLocalExtractedCourses());
      setLastSyncedAt(new Date());
    } finally {
      setIsLoading(false);
    }
  }, [icsUrl, isDemo]);

  useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]);

  // Derived Course Context
  const { ongoingCourse, previousCourse, nextCourse } = useMemo(() => {
    if (!courses || courses.length === 0) {
      return { ongoingCourse: null, previousCourse: null, nextCourse: null };
    }

    const nowMs = currentTime.getTime();

    const ongoing = courses.find(
      (c) => c.start.getTime() <= nowMs && c.end.getTime() > nowMs
    ) || null;

    const previousCandidates = courses
      .filter((c) => c.end.getTime() <= nowMs)
      .sort((a, b) => b.end.getTime() - a.end.getTime());
    const previous = previousCandidates.length > 0 ? previousCandidates[0] : null;

    const nextCandidates = courses
      .filter((c) => c.start.getTime() > nowMs)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    const next = nextCandidates.length > 0 ? nextCandidates[0] : null;

    return {
      ongoingCourse: ongoing,
      previousCourse: previous,
      nextCourse: next,
    };
  }, [courses, currentTime]);

  const activeCourseFolderUrl = ongoingCourse?.folderUrl || nextCourse?.folderUrl || courseFolderUrl;
  const effectiveZoomUrl = ongoingCourse?.zoomUrl || customZoomUrl;

  // Save Settings handler
  const handleSaveSettings = (newSettings: {
    icsUrl: string;
    courseFolderUrl: string;
    zoomUrl: string;
    isDemo: boolean;
  }) => {
    setIcsUrl(newSettings.icsUrl);
    setCourseFolderUrl(newSettings.courseFolderUrl);
    setCustomZoomUrl(newSettings.zoomUrl);
    setIsDemo(newSettings.isDemo);

    localStorage.setItem(STORAGE_KEY_ICS_URL, newSettings.icsUrl);
    localStorage.setItem(STORAGE_KEY_FOLDER_URL, newSettings.courseFolderUrl);
    localStorage.setItem(STORAGE_KEY_ZOOM_URL, newSettings.zoomUrl);
    localStorage.setItem(STORAGE_KEY_IS_DEMO, String(newSettings.isDemo));

    if (newSettings.isDemo) {
      setCourses(generateDemoCourses());
    } else {
      setCourses(getLocalExtractedCourses());
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-zinc-950">
      
      {/* Top Bar Navigation (Cleaned: only Quizz, Émargement and Sandwich menu directly visible) */}
      <TopBar
        courseFolderUrl={activeCourseFolderUrl}
        matchedFolder={ongoingCourse?.matchedFolder || nextCourse?.matchedFolder}
        zoomUrl={effectiveZoomUrl}
        isDemo={isDemo}
        isLoading={isLoading}
        lastSyncedAt={lastSyncedAt}
        onRefresh={loadScheduleData}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGame={() => setIsGameOpen(true)}
        onOpenDebug={() => setIsDebugOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center py-6">
        
        {/* Main Real-Time Digital Timer Display */}
        <MainTimer
          ongoingCourse={ongoingCourse}
          nextCourse={nextCourse}
          previousCourse={previousCourse}
          currentTime={currentTime}
        />

        {/* Live Music Player Widget (Mac Media / Apple Music / YouTube & Lo-Fi Beats) */}
        <MusicPlayer />

        {/* Footer Context Cards (Previous & Next Courses) */}
        <FooterCards
          previousCourse={previousCourse}
          nextCourse={nextCourse}
        />

        {/* Campus Game Banner Teaser */}
        <div className="w-full max-w-4xl mx-auto px-4 my-4">
          <div 
            onClick={() => setIsGameOpen(true)}
            className="group relative rounded-2xl bg-gradient-to-r from-indigo-950/70 via-zinc-900/80 to-emerald-950/70 border border-indigo-500/30 hover:border-indigo-500/60 p-4 sm:p-5 backdrop-blur-xl shadow-xl transition-all duration-300 hover:shadow-indigo-950/40 cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform shrink-0">
                🎓
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-zinc-100 group-hover:text-indigo-300 transition-colors">
                    Nouveau Jeu : Prof De Vinci ou Comptable LinkedIn ?
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500 text-white shadow-sm">
                    10 / 20 / 30 Manches
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 leading-snug">
                  Devinez qui enseigne au Pôle Léonard de Vinci parmi 99 chercheurs DVRC certifiés et 99 auditeurs LinkedIn !
                </p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsGameOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/40 transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <span>Lancer le jeu</span>
              <span>➜</span>
            </button>
          </div>
        </div>

        {/* Assessment & Quiz Agenda with JSON Datatable */}
        <AssessmentAgenda />

        {/* Complete Interactive Schedule Timeline (Previous, Present & Future Courses) */}
        <ScheduleTimeline
          courses={courses}
          ongoingCourse={ongoingCourse}
          currentTime={currentTime}
        />
      </main>

      {/* Footer Branding & Current Time Badge */}
      <footer className="w-full py-4 border-t border-zinc-900 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="flex items-center gap-2">
            <span>Tableau de bord Universitaire</span>
            <span className="inline-block w-1 h-1 rounded-full bg-zinc-700"></span>
            <span className="text-zinc-400 font-mono">Linear / Vercel Dark Theme</span>
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDebugOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 border border-zinc-800 hover:border-amber-500/30 transition-all text-xs font-mono cursor-pointer"
              title="Ouvrir le Centre de Débogage & Terminal (⌘D)"
            >
              <span>🛠️</span>
              <span>Debug & Terminal</span>
              <span className="text-[10px] text-zinc-600 hidden sm:inline font-mono">(⌘D)</span>
            </button>

            <p className="font-mono text-zinc-400 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span className="text-emerald-400 font-bold">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Configuration Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        icsUrl={icsUrl}
        courseFolderUrl={courseFolderUrl}
        zoomUrl={customZoomUrl}
        isDemo={isDemo}
        onSave={handleSaveSettings}
      />

      {/* Campus Game Modal */}
      <ProfOrAccountantGame
        isOpen={isGameOpen}
        onClose={() => setIsGameOpen(false)}
      />

      {/* Debug & Terminal Modal */}
      <DebugModal
        isOpen={isDebugOpen}
        onClose={() => setIsDebugOpen(false)}
      />

    </div>
  );
};

export default App;
