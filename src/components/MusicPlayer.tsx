import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  Volume1, 
  VolumeX, 
  Disc, 
  Music, 
  ListMusic, 
  Radio, 
  Sparkles, 
  Shuffle, 
  Repeat, 
  Plus, 
  ExternalLink,
  Laptop,
  Headphones,
  RefreshCw,
  Video
} from 'lucide-react';

export interface MacMediaInfo {
  active: boolean;
  source?: 'Apple Music' | 'YouTube' | 'YouTube Music';
  browser?: string;
  isPlaying?: boolean;
  playerState?: 'playing' | 'paused' | 'stopped';
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  position?: number;
  canControl?: boolean;
  url?: string;
  thumbnail?: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  src: string;
  coverGradient: string;
  genre: string;
}

const DEFAULT_PLAYLIST: Track[] = [
  {
    id: 'lofi-1',
    title: 'Study Session & Chill Beats',
    artist: 'Lofi Records & Chillhop',
    album: 'Deep Concentration Vol. 1',
    duration: 154,
    src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    coverGradient: 'from-emerald-500 via-teal-600 to-indigo-800',
    genre: 'Lofi / Study',
  },
  {
    id: 'lofi-2',
    title: 'Midnight Focus & Rain',
    artist: 'Quiet Mind Lab',
    album: 'Night Owl Coding',
    duration: 188,
    src: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
    coverGradient: 'from-indigo-600 via-purple-700 to-pink-800',
    genre: 'Ambient / Coding',
  },
  {
    id: 'lofi-3',
    title: 'Coffee Shop Acoustic Waves',
    artist: 'Nordic Chillout Collective',
    album: 'Warm Espresso Vibe',
    duration: 142,
    src: 'https://cdn.pixabay.com/download/audio/2023/10/24/audio_34b3f11467.mp3',
    coverGradient: 'from-amber-500 via-orange-600 to-rose-700',
    genre: 'Acoustic / Relax',
  },
  {
    id: 'lofi-4',
    title: 'Deep Synthwave Memory',
    artist: 'Cyber Study Flow',
    album: 'Retrofuturism 2026',
    duration: 210,
    src: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3',
    coverGradient: 'from-cyan-500 via-blue-600 to-violet-900',
    genre: 'Synth / Focus',
  },
  {
    id: 'lofi-radio',
    title: '24/7 Lofi Live Radio',
    artist: 'I Love Chillhop Radio',
    album: 'Worldwide Live Stream',
    duration: 0,
    src: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    coverGradient: 'from-emerald-600 via-cyan-600 to-blue-700',
    genre: 'Live Radio',
  },
];

export const MusicPlayer: React.FC = () => {
  // Mode selection: 'mac' (sync with Apple Music / YouTube) or 'lofi' (internal player)
  const [activeMode, setActiveMode] = useState<'mac' | 'lofi'>('mac');

  // macOS Live Media State
  const [macMedia, setMacMedia] = useState<MacMediaInfo | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [macCurrentPosition, setMacCurrentPosition] = useState<number>(0);

  // Internal Lofi Player State
  const [playlist, setPlaylist] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('univ_dashboard_music_playlist');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PLAYLIST;
  });

  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isLofiPlaying, setIsLofiPlaying] = useState<boolean>(false);
  const [lofiCurrentTime, setLofiCurrentTime] = useState<number>(0);
  const [lofiDuration, setLofiDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.75);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [showPlaylist, setShowPlaylist] = useState<boolean>(false);
  const [isCustomUrlOpen, setIsCustomUrlOpen] = useState<boolean>(false);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [customTitleInput, setCustomTitleInput] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthCtxRef = useRef<AudioContext | null>(null);
  const synthNodesRef = useRef<{ osc1?: OscillatorNode; osc2?: OscillatorNode; gain?: GainNode }>({});

  const currentLofiTrack = playlist[currentTrackIndex] || playlist[0];

  // Poll macOS Now Playing (Apple Music & YouTube)
  const fetchMacNowPlaying = useCallback(async () => {
    try {
      setIsPolling(true);
      const res = await fetch('/api/now-playing');
      if (res.ok) {
        const data: MacMediaInfo = await res.json();
        setMacMedia(data);
        if (data.position !== undefined) {
          setMacCurrentPosition(data.position);
        }
      }
    } catch {
      // Offline fallback
    } finally {
      setIsPolling(false);
    }
  }, []);

  // Poll loop: Every 2.5 seconds
  useEffect(() => {
    fetchMacNowPlaying();
    const interval = setInterval(fetchMacNowPlaying, 2500);
    return () => clearInterval(interval);
  }, [fetchMacNowPlaying]);

  // Smooth position ticker for Apple Music between polls
  useEffect(() => {
    if (activeMode === 'mac' && macMedia?.isPlaying && macMedia.source === 'Apple Music') {
      const ticker = setInterval(() => {
        setMacCurrentPosition((prev) => {
          if (macMedia.duration && prev >= macMedia.duration) return prev;
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(ticker);
    }
  }, [activeMode, macMedia?.isPlaying, macMedia?.source, macMedia?.duration]);

  // Media controls for Apple Music
  const sendMediaAction = async (action: 'playpause' | 'next' | 'previous') => {
    try {
      if (macMedia?.source === 'Apple Music') {
        // Optimistic UI update
        if (action === 'playpause') {
          setMacMedia((prev) => prev ? { ...prev, isPlaying: !prev.isPlaying, playerState: prev.isPlaying ? 'paused' : 'playing' } : null);
        }
      }
      await fetch('/api/media-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      setTimeout(fetchMacNowPlaying, 400);
    } catch (err) {
      console.error('Erreur contrôle média:', err);
    }
  };

  // --- Lofi Audio Handling ---
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = 'metadata';
      audioRef.current = audio;
    }

    const audio = audioRef.current;

    const handleLoadedMetadata = () => {
      setLofiDuration(audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) ? audio.duration : currentLofiTrack.duration);
    };

    const handleTimeUpdate = () => {
      setLofiCurrentTime(audio.currentTime);
      if (!lofiDuration && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setLofiDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        handleNextLofiTrack();
      }
    };

    const handleError = () => {
      if (isLofiPlaying && activeMode === 'lofi') {
        startSyntheticAmbient();
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [isRepeat, activeMode]);

  // Set track src on track change (Lofi)
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    
    stopSyntheticAmbient();
    audio.src = currentLofiTrack.src;
    audio.volume = isMuted ? 0 : volume;
    audio.load();

    if (isLofiPlaying && activeMode === 'lofi') {
      audio.play().catch(() => {
        startSyntheticAmbient();
      });
    }
  }, [currentTrackIndex]);

  // Web Audio Fallback Ambient Generator
  const startSyntheticAmbient = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!synthCtxRef.current) {
        synthCtxRef.current = new AudioCtx();
      }

      const ctx = synthCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      stopSyntheticAmbient();

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(isMuted ? 0 : volume * 0.2, ctx.currentTime);
      gain.connect(ctx.destination);

      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(146.83, ctx.currentTime); // D3

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(220.00, ctx.currentTime); // A3

      osc1.connect(gain);
      osc2.connect(gain);

      osc1.start();
      osc2.start();

      synthNodesRef.current = { osc1, osc2, gain };
    } catch {}
  };

  const stopSyntheticAmbient = () => {
    try {
      if (synthNodesRef.current.osc1) {
        synthNodesRef.current.osc1.stop();
        synthNodesRef.current.osc1.disconnect();
      }
      if (synthNodesRef.current.osc2) {
        synthNodesRef.current.osc2.stop();
        synthNodesRef.current.osc2.disconnect();
      }
      synthNodesRef.current = {};
    } catch {}
  };

  const toggleLofiPlay = () => {
    if (!audioRef.current) return;

    if (isLofiPlaying) {
      audioRef.current.pause();
      stopSyntheticAmbient();
      setIsLofiPlaying(false);
    } else {
      audioRef.current.volume = isMuted ? 0 : volume;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsLofiPlaying(true))
          .catch(() => {
            startSyntheticAmbient();
            setIsLofiPlaying(true);
          });
      }
    }
  };

  const handleNextLofiTrack = () => {
    if (isShuffle) {
      const nextIdx = Math.floor(Math.random() * playlist.length);
      setCurrentTrackIndex(nextIdx);
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    }
  };

  const handlePrevLofiTrack = () => {
    if (lofiCurrentTime > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
      setLofiCurrentTime(0);
    } else {
      setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setLofiCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
    if (synthNodesRef.current.gain && synthCtxRef.current) {
      synthNodesRef.current.gain.gain.setValueAtTime(newVol * 0.2, synthCtxRef.current.currentTime);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = volume;
      if (synthNodesRef.current.gain && synthCtxRef.current) {
        synthNodesRef.current.gain.gain.setValueAtTime(volume * 0.2, synthCtxRef.current.currentTime);
      }
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
      if (synthNodesRef.current.gain && synthCtxRef.current) {
        synthNodesRef.current.gain.gain.setValueAtTime(0, synthCtxRef.current.currentTime);
      }
    }
  };

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec) || sec < 0) return '0:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleAddCustomTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;

    const newTrack: Track = {
      id: `custom-${Date.now()}`,
      title: customTitleInput.trim() || 'Mon Flux Audio / Lofi',
      artist: 'Flux Personnalisé',
      album: 'Ma Playlist',
      duration: 180,
      src: customUrlInput.trim(),
      coverGradient: 'from-emerald-600 via-teal-700 to-zinc-900',
      genre: 'Custom Stream',
    };

    setPlaylist([newTrack, ...playlist]);
    setCurrentTrackIndex(0);
    setCustomUrlInput('');
    setCustomTitleInput('');
    setIsCustomUrlOpen(false);
  };

  const isMacActive = Boolean(macMedia && macMedia.active && macMedia.title);
  const isMacPlaying = Boolean(macMedia?.isPlaying);
  const isYouTube = Boolean(macMedia?.source?.includes('YouTube'));
  const isAppleMusic = macMedia?.source === 'Apple Music';

  const effectiveLofiDuration = lofiDuration > 0 ? lofiDuration : currentLofiTrack.duration || 180;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 my-4">
      {/* Outer Card */}
      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl p-4 sm:p-5 shadow-2xl relative overflow-hidden transition-all duration-300">
        
        {/* Subtle Ambient Color Glow based on source */}
        <div 
          className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-25 pointer-events-none transition-all duration-700 ${
            activeMode === 'mac'
              ? isYouTube
                ? 'bg-red-600'
                : isAppleMusic
                ? 'bg-rose-500'
                : 'bg-zinc-700'
              : `bg-gradient-to-br ${currentLofiTrack.coverGradient}`
          }`}
        />

        <div className="relative z-10 flex flex-col gap-4">
          
          {/* Top Bar: Source Selector & Status Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/60">
            
            {/* Source Mode Toggle Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-zinc-950/70 border border-zinc-800 rounded-xl w-fit">
              <button
                onClick={() => setActiveMode('mac')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeMode === 'mac'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Laptop className="w-3.5 h-3.5 text-rose-400" />
                <span> Lecteur Mac {isMacPlaying && <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>}</span>
              </button>

              <button
                onClick={() => setActiveMode('lofi')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeMode === 'lofi'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Headphones className="w-3.5 h-3.5 text-emerald-400" />
                <span>🎧 Lo-Fi Ambiance {isLofiPlaying && <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>}</span>
              </button>
            </div>

            {/* Live Status indicator */}
            <div className="flex items-center gap-2.5">
              {activeMode === 'mac' ? (
                isMacActive ? (
                  <div className="flex items-center gap-2">
                    {/* Source Pill */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono tracking-tight border ${
                      isYouTube
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      {isYouTube ? (
                        <Video className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                      ) : (
                        <span className="text-sm leading-none font-bold"></span>
                      )}
                      <span>{macMedia?.source}</span>
                    </span>

                    {/* Animated Equalizer soundwave if playing */}
                    {isMacPlaying ? (
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        <div className="flex items-end gap-0.5 h-3">
                          <span className="w-0.5 bg-emerald-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-2.5"></span>
                          <span className="w-0.5 bg-emerald-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.2s] h-3.5"></span>
                          <span className="w-0.5 bg-emerald-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.4s] h-1.5"></span>
                        </div>
                        <span className="text-[11px] font-mono">En lecture</span>
                      </div>
                    ) : (
                      <span className="text-zinc-500 text-xs font-medium bg-zinc-800/60 border border-zinc-700/40 px-2 py-0.5 rounded-md">
                        En pause
                      </span>
                    )}

                    {/* Refresh sync button */}
                    <button
                      onClick={fetchMacNowPlaying}
                      title="Actualiser la détection multimédia"
                      className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin text-emerald-400' : ''}`} />
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
                    <span>En attente de musique sur votre Mac...</span>
                  </span>
                )
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5" />
                    <span>{isLofiPlaying ? 'Lo-Fi En cours' : 'Lo-Fi En pause'}</span>
                  </span>

                  <button
                    onClick={() => setShowPlaylist(!showPlaylist)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      showPlaylist 
                        ? 'bg-zinc-800 text-emerald-400 border-zinc-700' 
                        : 'bg-zinc-950/40 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <ListMusic className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Playlist ({playlist.length})</span>
                  </button>

                  <button
                    onClick={() => setIsCustomUrlOpen(!isCustomUrlOpen)}
                    title="Ajouter un lien de flux audio"
                    className="p-1 rounded-lg bg-zinc-950/40 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* ========================================================= */}
          {/* MODE 1: MAC LIVE MEDIA (APPLE MUSIC & YOUTUBE) */}
          {/* ========================================================= */}
          {activeMode === 'mac' && (
            <div>
              {isMacActive ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-5">
                    
                    {/* Left: Artwork / Thumbnail + Track Meta */}
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      
                      {/* Album Cover / YouTube Thumbnail Visual */}
                      <div className="relative group shrink-0">
                        {isYouTube && macMedia?.thumbnail ? (
                          <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden shadow-lg border border-red-500/40 group-hover:scale-105 transition-transform">
                            <img 
                              src={macMedia.thumbnail} 
                              alt="Vignette YouTube" 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center pb-1">
                              <span className="text-[9px] font-bold text-red-400 font-mono tracking-wider uppercase">YouTube</span>
                            </div>
                          </div>
                        ) : isAppleMusic && macMedia?.thumbnail ? (
                          <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-tr from-rose-500 via-pink-600 to-indigo-700 shadow-xl flex items-center justify-center">
                            <div className={`w-full h-full rounded-full overflow-hidden border border-zinc-700/80 ${isMacPlaying ? 'animate-[spin_12s_linear_infinite]' : ''}`}>
                              <img 
                                src={macMedia.thumbnail} 
                                alt="Pochette Apple Music" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to vinyl disc if artwork file not readable
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                              <Disc className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        ) : (
                          /* Fallback Disc Visual */
                          <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-700 p-1 shadow-lg flex items-center justify-center">
                            <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-700">
                              <Disc className="w-8 h-8 text-zinc-400" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Title & Artist */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-zinc-100 truncate tracking-tight" title={macMedia?.title}>
                            {macMedia?.title}
                          </h3>
                        </div>

                        <p className="text-xs text-zinc-300 truncate mt-0.5 font-medium flex items-center gap-1.5">
                          <span>{macMedia?.artist}</span>
                          {macMedia?.browser && (
                            <span className="text-[10px] text-zinc-500 font-mono">({macMedia.browser})</span>
                          )}
                        </p>

                        {macMedia?.album && (
                          <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                            {macMedia.album}
                          </p>
                        )}
                      </div>

                    </div>

                    {/* Right: Controls based on source */}
                    <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-3">
                      {isAppleMusic ? (
                        /* Apple Music Playback Control Buttons */
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => sendMediaAction('previous')}
                            title="Piste précédente (Apple Music)"
                            className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-all active:scale-95 cursor-pointer"
                          >
                            <SkipBack className="w-5 h-5 fill-zinc-400/20" />
                          </button>

                          <button
                            onClick={() => sendMediaAction('playpause')}
                            title={isMacPlaying ? 'Mettre en pause Apple Music' : 'Lancer Apple Music'}
                            className="w-12 h-12 rounded-full bg-rose-500 hover:bg-rose-400 text-white flex items-center justify-center shadow-lg shadow-rose-950/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            {isMacPlaying ? (
                              <Pause className="w-6 h-6 fill-white" />
                            ) : (
                              <Play className="w-6 h-6 fill-white ml-0.5" />
                            )}
                          </button>

                          <button
                            onClick={() => sendMediaAction('next')}
                            title="Piste suivante (Apple Music)"
                            className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-all active:scale-95 cursor-pointer"
                          >
                            <SkipForward className="w-5 h-5 fill-zinc-400/20" />
                          </button>
                        </div>
                      ) : isYouTube && macMedia?.url ? (
                        /* YouTube Video Link Button */
                        <a
                          href={macMedia.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-950/40 transition-all active:scale-95 cursor-pointer"
                        >
                          <Video className="w-4 h-4 fill-white" />
                          <span>Ouvrir sur YouTube</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                        </a>
                      ) : null}
                    </div>

                  </div>

                  {/* Progress Bar for Apple Music */}
                  {isAppleMusic && macMedia?.duration && macMedia.duration > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden relative">
                        <div 
                          className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-300 rounded-full"
                          style={{ width: `${Math.min(100, (macCurrentPosition / macMedia.duration) * 100)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                        <span>{formatSeconds(macCurrentPosition)}</span>
                        <span>{formatSeconds(macMedia.duration)}</span>
                      </div>
                    </div>
                  )}

                  {/* YouTube Live Info Bar */}
                  {isYouTube && (
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-1 border-t border-zinc-800/40">
                      <span className="flex items-center gap-1.5 text-red-400">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                        <span>Synchronisé en direct avec YouTube ({macMedia?.browser})</span>
                      </span>
                      <span>En écoute active</span>
                    </div>
                  )}

                </div>
              ) : (
                /* Empty Mac state */
                <div className="py-8 px-4 text-center rounded-xl bg-zinc-950/30 border border-dashed border-zinc-800">
                  <div className="w-12 h-12 rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mx-auto mb-3">
                    <Laptop className="w-6 h-6 text-zinc-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-300">
                    Aucun média en cours de lecture sur votre Mac
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                    Lancez un morceau dans <strong>Apple Music</strong> ou lancez une vidéo sur <strong>YouTube</strong> (dans Safari, Google Chrome ou Arc) pour voir apparaître les informations en temps réel.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setActiveMode('lofi')}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Headphones className="w-3.5 h-3.5" />
                      <span>Écouter la Playlist Lo-Fi d'étude</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* MODE 2: INTERNAL LO-FI STUDY BEATS PLAYER */}
          {/* ========================================================= */}
          {activeMode === 'lofi' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-5">
                
                {/* Vinyl & Info */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative group shrink-0">
                    <div 
                      className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr ${currentLofiTrack.coverGradient} p-1 shadow-lg flex items-center justify-center ${
                        isLofiPlaying ? 'animate-[spin_10s_linear_infinite]' : ''
                      }`}
                    >
                      <div className="w-full h-full rounded-full bg-zinc-950/90 border border-zinc-700/60 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full border border-zinc-700/40 flex items-center justify-center">
                          <div className="w-4 h-4 rounded-full bg-zinc-800 border-2 border-emerald-400/80 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-950"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                      <Disc className="w-6 h-6 text-zinc-300" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-zinc-100 truncate tracking-tight">
                        {currentLofiTrack.title}
                      </h3>
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {currentLofiTrack.genre}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 truncate mt-0.5 font-medium">
                      {currentLofiTrack.artist}
                    </p>

                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {currentLofiTrack.album}
                    </p>
                  </div>
                </div>

                {/* Controls */}
                <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsShuffle(!isShuffle)}
                      title="Lecture aléatoire"
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        isShuffle ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <Shuffle className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handlePrevLofiTrack}
                      title="Titre précédent"
                      className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-all active:scale-95 cursor-pointer"
                    >
                      <SkipBack className="w-5 h-5 fill-zinc-400/20" />
                    </button>

                    <button
                      onClick={toggleLofiPlay}
                      title={isLofiPlaying ? 'Pause' : 'Lecture'}
                      className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center justify-center shadow-lg shadow-emerald-950/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      {isLofiPlaying ? (
                        <Pause className="w-6 h-6 fill-zinc-950" />
                      ) : (
                        <Play className="w-6 h-6 fill-zinc-950 ml-0.5" />
                      )}
                    </button>

                    <button
                      onClick={handleNextLofiTrack}
                      title="Titre suivant"
                      className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-all active:scale-95 cursor-pointer"
                    >
                      <SkipForward className="w-5 h-5 fill-zinc-400/20" />
                    </button>

                    <button
                      onClick={() => setIsRepeat(!isRepeat)}
                      title="Répéter la piste"
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        isRepeat ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <Repeat className="w-4 h-4" />
                    </button>

                    {/* Volume Slider */}
                    <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-3 border-l border-zinc-800">
                      <button
                        onClick={toggleMute}
                        title={isMuted ? 'Activer le son' : 'Couper le son'}
                        className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-4 h-4 text-red-400" />
                        ) : volume < 0.5 ? (
                          <Volume1 className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-emerald-400" />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-18 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Progress Bar */}
              <div className="space-y-1 pt-1">
                <input
                  type="range"
                  min="0"
                  max={effectiveLofiDuration || 100}
                  step="0.1"
                  value={lofiCurrentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 transition-all"
                />

                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>{formatSeconds(lofiCurrentTime)}</span>
                  <span>{currentLofiTrack.src.includes('radio') ? 'LIVE' : formatSeconds(effectiveLofiDuration)}</span>
                </div>
              </div>

              {/* Custom Stream Input Form Drawer */}
              {isCustomUrlOpen && (
                <form onSubmit={handleAddCustomTrack} className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      Ajouter un flux audio ou MP3 personnalisé
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCustomUrlOpen(false)}
                      className="text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      Fermer
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Titre (ex: Ma Radio Lofi)"
                      value={customTitleInput}
                      onChange={(e) => setCustomTitleInput(e.target.value)}
                      className="bg-zinc-900 border border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="url"
                      required
                      placeholder="Lien audio MP3 ou streaming (https://...)"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      className="bg-zinc-900 border border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Ajouter à la playlist
                    </button>
                  </div>
                </form>
              )}

              {/* Playlist Drawer */}
              {showPlaylist && (
                <div className="pt-2 border-t border-zinc-800/80 space-y-1.5 max-h-56 overflow-y-auto scrollbar-thin">
                  {playlist.map((track, idx) => {
                    const isSelected = idx === currentTrackIndex;
                    return (
                      <button
                        key={track.id}
                        onClick={() => {
                          setCurrentTrackIndex(idx);
                          setIsLofiPlaying(true);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-800/90 border border-emerald-500/30 text-white'
                            : 'bg-zinc-950/40 hover:bg-zinc-850/50 text-zinc-400 hover:text-zinc-200 border border-zinc-850/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-tr ${track.coverGradient}`}>
                            {isSelected && isLofiPlaying ? (
                              <div className="flex items-end gap-0.5 h-3">
                                <span className="w-0.5 bg-white rounded-full animate-pulse h-2"></span>
                                <span className="w-0.5 bg-white rounded-full animate-pulse h-3"></span>
                                <span className="w-0.5 bg-white rounded-full animate-pulse h-1.5"></span>
                              </div>
                            ) : (
                              <Music className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>

                          <div className="truncate">
                            <p className={`text-xs font-medium truncate ${isSelected ? 'text-emerald-400 font-bold' : ''}`}>
                              {track.title}
                            </p>
                            <p className="text-[10px] text-zinc-500 truncate">
                              {track.artist}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono text-zinc-500">
                          <span>{track.genre}</span>
                          <span>{track.src.includes('radio') ? 'LIVE' : formatSeconds(track.duration)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
