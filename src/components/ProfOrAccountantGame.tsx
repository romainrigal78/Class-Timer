import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Trophy, 
  RotateCcw, 
  Flame, 
  CheckCircle2, 
  XCircle, 
  Volume2, 
  VolumeX, 
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';
import gameData from '../data/gameProfOrAccountant.json';

export interface GamePerson {
  id: string;
  name: string;
  type: 'prof' | 'accountant';
  role: string;
  organization: string;
  imageUrl: string;
  funFact: string;
}

interface ProfOrAccountantGameProps {
  isOpen: boolean;
  onClose: () => void;
}

type RoundCount = 10 | 20 | 30 | 'infinite';

export const ProfOrAccountantGame: React.FC<ProfOrAccountantGameProps> = ({ isOpen, onClose }) => {
  // Game Setup
  const [selectedRounds, setSelectedRounds] = useState<RoundCount>(10);
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'gameover'>('setup');
  
  // Active Game State
  const [deck, setDeck] = useState<GamePerson[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [selectedChoice, setSelectedChoice] = useState<'prof' | 'accountant' | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // High Scores in LocalStorage
  const [highScore, setHighScore] = useState<{ score: number; total: number; percentage: number }>(() => {
    try {
      const saved = localStorage.getItem('univ_game_prof_accountant_best');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { score: 0, total: 0, percentage: 0 };
  });

  // Sound synthesis using Web Audio API
  const playTone = useCallback((type: 'correct' | 'wrong' | 'win') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'correct') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'wrong') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
        osc.frequency.exponentialRampToValueAtTime(164.81, ctx.currentTime + 0.15); // E3
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'win') {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
          gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.08 + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.2);
        });
      }
    } catch {}
  }, [soundEnabled]);

  // Start a new game
  const startGame = useCallback((roundCount: RoundCount = selectedRounds) => {
    // Collect and shuffle
    const allProfs = (gameData.professors || []) as GamePerson[];
    const allAccs = (gameData.accountants || []) as GamePerson[];

    const shuffledProfs = [...allProfs].sort(() => Math.random() - 0.5);
    const shuffledAccs = [...allAccs].sort(() => Math.random() - 0.5);

    let deckSize = roundCount === 'infinite' ? 60 : roundCount;
    const half = Math.ceil(deckSize / 2);

    const combined = [
      ...shuffledProfs.slice(0, half),
      ...shuffledAccs.slice(0, half)
    ].sort(() => Math.random() - 0.5);

    const finalDeck = roundCount === 'infinite' ? combined : combined.slice(0, roundCount);

    setDeck(finalDeck);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setSelectedChoice(null);
    setIsAnswered(false);
    setGameState('playing');
  }, [selectedRounds]);

  const currentPerson: GamePerson | undefined = deck[currentIndex];

  // Handle Answer Selection
  const handleAnswer = (choice: 'prof' | 'accountant') => {
    if (isAnswered || !currentPerson) return;

    setSelectedChoice(choice);
    setIsAnswered(true);

    const isCorrect = choice === currentPerson.type;

    if (isCorrect) {
      const newScore = score + 1;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      if (newStreak > maxStreak) {
        setMaxStreak(newStreak);
      }

      playTone('correct');

      // Mini confetti on streak milestone
      if (newStreak % 5 === 0 || newStreak === 3) {
        confetti({
          particleCount: 25,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#10b981', '#6366f1', '#f59e0b']
        });
      }
    } else {
      setStreak(0);
      playTone('wrong');
    }
  };

  // Next Question
  const handleNext = () => {
    if (currentIndex + 1 < deck.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedChoice(null);
      setIsAnswered(false);
    } else {
      // Game Over
      const percentage = Math.round((score / deck.length) * 100);

      // Check for High Score
      if (percentage > highScore.percentage || (percentage === highScore.percentage && score > highScore.score)) {
        const newBest = { score, total: deck.length, percentage };
        setHighScore(newBest);
        try {
          localStorage.setItem('univ_game_prof_accountant_best', JSON.stringify(newBest));
        } catch {}
      }

      setGameState('gameover');

      if (percentage >= 70) {
        playTone('win');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.5 },
          colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899']
        });
      }
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isOpen || gameState !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (!isAnswered) {
        if (e.key === 'ArrowLeft' || e.key === '1') {
          handleAnswer('prof');
        } else if (e.key === 'ArrowRight' || e.key === '2') {
          handleAnswer('accountant');
        }
      } else {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, gameState, isAnswered, handleAnswer, handleNext, onClose]);

  // Rank determination based on score percentage
  const getRankBadge = (pct: number) => {
    if (pct === 100) {
      return {
        title: "Légende Absolue du Pôle & Chasseur de Têtes",
        desc: "Tu reconnais un enseignant-chercheur de De Vinci à 50 mètres dans l'Arche !",
        badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        icon: "👑"
      };
    }
    if (pct >= 80) {
      return {
        title: "Major de Promo De Vinci",
        desc: "Impossible de te duper avec un costume et un titre LinkedIn !",
        badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        icon: "🎓"
      };
    }
    if (pct >= 60) {
      return {
        title: "Auditeur Senior chez Deloitte",
        desc: "Très bon score ! Tu as failli confondre un prof de gestion avec un associé Mazars.",
        badgeClass: "bg-blue-500/20 text-blue-300 border-blue-500/40",
        icon: "💼"
      };
    }
    if (pct >= 40) {
      return {
        title: "Stagiaire en Période Fiscale",
        desc: "La frontière entre chercheur académique et expert-comptable est encore mince.",
        badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/40",
        icon: "📑"
      };
    }
    return {
      title: "Perdu dans les couloirs du Pôle",
      desc: "Tu dis bonjour à des comptables LinkedIn en croyant que ce sont tes profs de TD !",
      badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      icon: "🤷‍♂️"
    };
  };

  if (!isOpen) return null;

  const progressPercent = deck.length > 0 ? ((currentIndex + (isAnswered ? 1 : 0)) / deck.length) * 100 : 0;
  const isCorrect = isAnswered && selectedChoice === currentPerson?.type;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500"></div>

        {/* Modal Top Bar */}
        <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between gap-4 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 border border-indigo-500/30 flex items-center justify-center shadow-inner">
              <span className="text-xl">🎓</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-100 tracking-tight">
                  Prof De Vinci ou Comptable LinkedIn ?
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Jeu Exclusif
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                99 Enseignants-Chercheurs DVRC certifiés vs 99 Professionnels LinkedIn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Couper le son" : "Activer le son"}
              className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-600" />}
            </button>

            <button
              onClick={onClose}
              title="Fermer le jeu (Échap)"
              className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 scrollbar-thin">

          {/* ========================================================= */}
          {/* STATE 1: SETUP SCREEN (CHOICE OF ROUNDS) */}
          {/* ========================================================= */}
          {gameState === 'setup' && (
            <div className="flex flex-col items-center text-center py-4 space-y-6">
              
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-500/20 via-indigo-500/20 to-amber-500/20 border-2 border-indigo-500/30 flex items-center justify-center shadow-xl shadow-indigo-950/20">
                  <div className="flex items-center gap-1 text-4xl">
                    <span>🎓</span>
                    <span className="text-2xl text-zinc-500 font-bold">vs</span>
                    <span>💼</span>
                  </div>
                </div>
                <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-zinc-950 shadow-md">
                  198 Profils
                </span>
              </div>

              <div className="max-w-md space-y-2">
                <h4 className="text-xl font-black text-zinc-100 tracking-tight">
                  Le Grand Défi du Campus
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Une photo vous est présentée. À vous de deviner s'il s'agit d'un <strong>Enseignant-Chercheur de De Vinci</strong> ou d'un <strong>Comptable / Auditeur sur LinkedIn</strong> !
                </p>
              </div>

              {/* Best Score Banner if exists */}
              {highScore.total > 0 && (
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-zinc-900/90 border border-amber-500/30 text-amber-300 text-xs">
                  <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Votre record : <strong>{highScore.score} / {highScore.total}</strong> ({highScore.percentage}%)
                  </span>
                </div>
              )}

              {/* Select Number of Rounds */}
              <div className="w-full max-w-md space-y-2.5 text-left">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Choisissez la durée de la partie :
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { count: 10 as RoundCount, label: "10 Manches", sub: "Rapide • 2 min", icon: "⚡" },
                    { count: 20 as RoundCount, label: "20 Manches", sub: "Standard • 4 min", icon: "🎯" },
                    { count: 30 as RoundCount, label: "30 Manches", sub: "Expert • 6 min", icon: "🔥" },
                  ].map((option) => (
                    <button
                      key={option.count}
                      onClick={() => setSelectedRounds(option.count)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        selectedRounds === option.count
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-950/30'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                      }`}
                    >
                      <span className="text-lg">{option.icon}</span>
                      <span className="text-xs font-bold">{option.label}</span>
                      <span className="text-[10px] text-zinc-500">{option.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Launch Game Button */}
              <button
                onClick={() => startGame(selectedRounds)}
                className="w-full max-w-md py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-zinc-950 font-bold text-sm shadow-xl shadow-emerald-950/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Play className="w-4 h-4 fill-zinc-950" />
                <span>Lancer la partie ({selectedRounds} manches)</span>
              </button>

            </div>
          )}

          {/* ========================================================= */}
          {/* STATE 2: ACTIVE QUESTION SCREEN */}
          {/* ========================================================= */}
          {gameState === 'playing' && currentPerson && (
            <div className="space-y-4">
              
              {/* Header: Round, Score & Streak */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-zinc-300">
                    Manche {currentIndex + 1} / {deck.length}
                  </span>

                  <div className="flex items-center gap-3">
                    {streak >= 2 && (
                      <span className="flex items-center gap-1 text-amber-400 font-bold animate-pulse">
                        <Flame className="w-3.5 h-3.5 fill-amber-400" />
                        <span>Série : {streak}</span>
                      </span>
                    )}

                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      Score : {score} / {currentIndex + (isAnswered ? 1 : 0)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Portrait Presentation Card */}
              <div className="relative rounded-2xl bg-zinc-900/90 border border-zinc-800 p-4 sm:p-5 flex flex-col items-center justify-center shadow-xl">
                
                {/* Image Frame */}
                <div className="relative group">
                  <div className={`w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden border-2 shadow-2xl transition-all duration-300 ${
                    isAnswered
                      ? isCorrect
                        ? 'border-emerald-500 ring-4 ring-emerald-500/20'
                        : 'border-rose-500 ring-4 ring-rose-500/20'
                      : 'border-zinc-700 hover:border-zinc-500'
                  }`}>
                    <img 
                      src={currentPerson.imageUrl} 
                      alt="Profil à deviner" 
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://randomuser.me/api/portraits/lego/${(currentIndex % 9) + 1}.jpg`;
                      }}
                    />
                  </div>

                  {/* Corner Badge */}
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-sm shadow-md">
                    {isAnswered ? (
                      currentPerson.type === 'prof' ? '🎓' : '💼'
                    ) : (
                      '❓'
                    )}
                  </div>
                </div>

                {/* Question Prompt or Identity Reveal */}
                {!isAnswered ? (
                  <div className="mt-4 text-center space-y-1">
                    <h4 className="text-base sm:text-lg font-bold text-zinc-100">
                      Qui est cette personne ?
                    </h4>
                    <p className="text-xs text-zinc-500">
                      Faites votre choix ci-dessous ou utilisez les touches [1] et [2]
                    </p>
                  </div>
                ) : (
                  /* Revealed Identity Card */
                  <div className="mt-4 w-full text-center space-y-2 animate-in fade-in zoom-in-95 duration-200">
                    
                    {/* Status Pill */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm">
                      {isCorrect ? (
                        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Bien vu ! Réponse exacte (+1 pt)
                        </span>
                      ) : (
                        <span className="text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                          <XCircle className="w-4 h-4 text-rose-400" />
                          Raté ! C'était un piège
                        </span>
                      )}
                    </div>

                    {/* Person Real Details */}
                    <div>
                      <h4 className="text-base sm:text-lg font-black text-zinc-100 tracking-tight">
                        {currentPerson.name}
                      </h4>
                      
                      <div className="flex items-center justify-center gap-2 text-xs text-zinc-300 font-medium mt-0.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold ${
                          currentPerson.type === 'prof'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-indigo-500/20 text-indigo-400'
                        }`}>
                          {currentPerson.type === 'prof' ? '🎓 Prof De Vinci' : '💼 Comptable LinkedIn'}
                        </span>
                        <span className="text-zinc-400 font-normal">
                          {currentPerson.role}
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">
                        🏢 {currentPerson.organization}
                      </p>
                    </div>

                    {/* Fun Fact / Anecdote */}
                    {currentPerson.funFact && (
                      <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-300 italic max-w-lg mx-auto">
                        « {currentPerson.funFact} »
                      </div>
                    )}

                  </div>
                )}

              </div>

              {/* Action Buttons */}
              {!isAnswered ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  
                  {/* Option 1: Prof De Vinci */}
                  <button
                    onClick={() => handleAnswer('prof')}
                    className="p-4 rounded-2xl bg-zinc-900/90 hover:bg-emerald-950/30 border border-zinc-800 hover:border-emerald-500/50 text-left transition-all active:scale-[0.98] group cursor-pointer shadow-lg shadow-black/20"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-2xl">🎓</span>
                      <span className="text-[11px] font-mono text-zinc-500 group-hover:text-emerald-400">
                        Touche [1] ou [←]
                      </span>
                    </div>
                    <p className="text-base font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                      Professeur De Vinci
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Enseignant-chercheur EMLV / ESILV
                    </p>
                  </button>

                  {/* Option 2: Comptable LinkedIn */}
                  <button
                    onClick={() => handleAnswer('accountant')}
                    className="p-4 rounded-2xl bg-zinc-900/90 hover:bg-indigo-950/30 border border-zinc-800 hover:border-indigo-500/50 text-left transition-all active:scale-[0.98] group cursor-pointer shadow-lg shadow-black/20"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-2xl">💼</span>
                      <span className="text-[11px] font-mono text-zinc-500 group-hover:text-indigo-400">
                        Touche [2] ou [→]
                      </span>
                    </div>
                    <p className="text-base font-bold text-zinc-100 group-hover:text-indigo-400 transition-colors">
                      Comptable LinkedIn
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Expert-comptable, auditeur Big 4, DAF
                    </p>
                  </button>

                </div>
              ) : (
                /* Next Round Button */
                <button
                  onClick={handleNext}
                  className="w-full py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm shadow-lg shadow-emerald-950/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>
                    {currentIndex + 1 < deck.length ? "Personne Suivante ➜" : "Voir le Résultat Final 🏆"}
                  </span>
                  <span className="text-xs font-mono font-normal opacity-80">
                    (Espace ou Entrée)
                  </span>
                </button>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* STATE 3: GAME OVER / SCORE SUMMARY */}
          {/* ========================================================= */}
          {gameState === 'gameover' && (
            <div className="flex flex-col items-center text-center py-4 space-y-6 animate-in zoom-in-95 duration-300">
              
              {/* Rank Badge */}
              {(() => {
                const pct = Math.round((score / deck.length) * 100);
                const rank = getRankBadge(pct);

                return (
                  <div className="space-y-4 max-w-md">
                    <div className="w-20 h-20 rounded-3xl bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center text-4xl mx-auto shadow-xl">
                      {rank.icon}
                    </div>

                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${rank.badgeClass} mb-2`}>
                        {rank.title}
                      </span>
                      <h4 className="text-3xl font-black text-zinc-100 tracking-tight">
                        {score} / {deck.length}
                      </h4>
                      <p className="text-sm font-semibold text-emerald-400 mt-1">
                        {pct}% de bonnes réponses
                      </p>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                        {rank.desc}
                      </p>
                    </div>

                    {/* Stats Summary Grid */}
                    <div className="grid grid-cols-2 gap-3 text-left pt-2">
                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                        <span className="text-[11px] text-zinc-500 block">Série max</span>
                        <span className="text-lg font-bold text-amber-400">🔥 {maxStreak} d'affilée</span>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                        <span className="text-[11px] text-zinc-500 block">Meilleur record</span>
                        <span className="text-lg font-bold text-indigo-400">🏆 {highScore.percentage}%</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
                <button
                  onClick={() => startGame(selectedRounds)}
                  className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Rejouer ({selectedRounds} manches)</span>
                </button>

                <button
                  onClick={() => setGameState('setup')}
                  className="w-full py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <span>Changer de mode</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
