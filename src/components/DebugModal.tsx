import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Terminal as TerminalIcon, 
  FileCode2, 
  Save, 
  RotateCcw, 
  Copy, 
  Check, 
  AlertCircle, 
  Play, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  Maximize2,
  Minimize2
} from 'lucide-react';

interface JsonFileInfo {
  id: string;
  name: string;
  path: string;
  description: string;
  exists: boolean;
  size: number;
  updatedAt: string;
}

interface CommandHistoryItem {
  id: string;
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  timestamp: string;
}

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const USEFUL_COMMANDS = [
  { cmd: 'git status', desc: 'Fichiers modifiés & branche' },
  { cmd: 'npm run build', desc: 'Compiler & tester TypeScript' },
  { cmd: 'ls -lh src/data', desc: 'Lister les fichiers JSON' },
  { cmd: 'open .', desc: 'Ouvrir le projet dans le Finder' },
  { cmd: 'open ~/Desktop', desc: 'Ouvrir le bureau macOS' },
  { cmd: 'lsof -i :5173', desc: 'Inspecter le port du serveur Vite' },
  { cmd: "osascript -e 'tell app \"Music\" to get player state as string'", desc: 'Statut du lecteur Apple Music' },
  { cmd: 'node -v && npm -v', desc: 'Versions de Node et npm' },
  { cmd: 'clear', desc: 'Effacer l\'écran du terminal' },
];

export const DebugModal: React.FC<DebugModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'json' | 'terminal'>('json');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // JSON Editor State
  const [fileList, setFileList] = useState<JsonFileInfo[]>([]);
  const [selectedFileKey, setSelectedFileKey] = useState<string>('quizzes');
  const [fileContent, setFileContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
  const [isSavingFile, setIsSavingFile] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Terminal State
  const [commandInput, setCommandInput] = useState<string>('');
  const [history, setHistory] = useState<CommandHistoryItem[]>([
    {
      id: 'init-1',
      command: 'welcome',
      stdout: '⚡ Class Dashboard Debug Terminal (zsh)\nMode développeur actif. Tapez une commande ou cliquez sur les suggestions ci-dessous.',
      stderr: '',
      exitCode: 0,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [commandHistoryList, setCommandHistoryList] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isExecutingCmd, setIsExecutingCmd] = useState<boolean>(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load JSON file list when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFileList();
    }
  }, [isOpen]);

  const loadFileList = async () => {
    try {
      const res = await fetch('/api/debug/json/list');
      if (res.ok) {
        const data = await res.json();
        setFileList(data);
      }
    } catch (err) {
      console.warn('Erreur lecture liste JSON:', err);
    }
  };

  // Load specific JSON file
  const loadFile = async (key: string) => {
    setIsLoadingFile(true);
    setJsonError(null);
    setSaveSuccessMsg(null);
    try {
      const res = await fetch(`/api/debug/json/read?file=${encodeURIComponent(key)}`);
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content);
        setOriginalContent(data.content);
        setSelectedFileKey(key);
      } else {
        const err = await res.json();
        setJsonError(err.error || 'Erreur lors du chargement du fichier.');
      }
    } catch (err: any) {
      setJsonError(err.message || 'Erreur réseau.');
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Load initial file on tab or modal open
  useEffect(() => {
    if (isOpen && activeTab === 'json') {
      loadFile(selectedFileKey);
    }
  }, [isOpen, selectedFileKey]);

  // Real-time JSON validation
  const validateJson = (content: string): boolean => {
    if (!content.trim()) {
      setJsonError('Le fichier est vide.');
      return false;
    }
    try {
      JSON.parse(content);
      setJsonError(null);
      return true;
    } catch (err: any) {
      setJsonError(err.message);
      return false;
    }
  };

  const handleContentChange = (newVal: string) => {
    setFileContent(newVal);
    validateJson(newVal);
  };

  // Prettify / Format JSON
  const handlePrettify = () => {
    try {
      const parsed = JSON.parse(fileContent);
      const formatted = JSON.stringify(parsed, null, 2);
      setFileContent(formatted);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(`Impossible de formater : ${err.message}`);
    }
  };

  // Save JSON back to disk
  const handleSaveJson = async () => {
    if (!validateJson(fileContent)) return;

    setIsSavingFile(true);
    setSaveSuccessMsg(null);
    try {
      const res = await fetch('/api/debug/json/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileKey: selectedFileKey,
          content: fileContent,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setOriginalContent(fileContent);
        setSaveSuccessMsg(result.message || 'Enregistré avec succès !');
        loadFileList(); // Refresh metadata
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      } else {
        const err = await res.json();
        setJsonError(err.error || 'Erreur lors de l\'enregistrement.');
      }
    } catch (err: any) {
      setJsonError(err.message || 'Erreur réseau.');
    } finally {
      setIsSavingFile(false);
    }
  };

  // Copy JSON to clipboard
  const handleCopyJson = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Tab key handling in Textarea
  const handleKeyDownEditor = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      textarea.value = value.substring(0, start) + '  ' + value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      setFileContent(textarea.value);
      validateJson(textarea.value);
    }
  };

  // ==========================================
  // Terminal Execution Handling
  // ==========================================
  const executeCommand = async (cmdToRun: string) => {
    const trimmed = cmdToRun.trim();
    if (!trimmed) return;

    if (trimmed === 'clear') {
      setHistory([]);
      setCommandInput('');
      return;
    }

    setIsExecutingCmd(true);
    setCommandInput('');
    setCommandHistoryList((prev) => [trimmed, ...prev]);
    setHistoryIndex(-1);

    try {
      const res = await fetch('/api/debug/terminal/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: trimmed }),
      });

      const data = await res.json();

      setHistory((prev) => [
        ...prev,
        {
          id: `cmd-${Date.now()}`,
          command: trimmed,
          stdout: data.stdout || '',
          stderr: data.stderr || (data.error ? data.error : ''),
          exitCode: data.exitCode !== undefined ? data.exitCode : 0,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setHistory((prev) => [
        ...prev,
        {
          id: `cmd-${Date.now()}`,
          command: trimmed,
          stdout: '',
          stderr: err.message || 'Erreur d\'exécution réseau.',
          exitCode: 1,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
      ]);
    } finally {
      setIsExecutingCmd(false);
      setTimeout(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 50);
    }
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(commandInput);
  };

  // Command history navigation (Arrow Up / Down)
  const handleTerminalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistoryList.length > 0) {
        const nextIdx = Math.min(historyIndex + 1, commandHistoryList.length - 1);
        setHistoryIndex(nextIdx);
        setCommandInput(commandHistoryList[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setCommandInput(commandHistoryList[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommandInput('');
      }
    }
  };

  if (!isOpen) return null;

  const currentFileMeta = fileList.find((f) => f.id === selectedFileKey);
  const isDirty = fileContent !== originalContent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className={`relative w-full bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isFullScreen ? 'h-[98vh] max-w-[98vw]' : 'h-[88vh] max-w-5xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Glow Accent Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500"></div>

        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 border-b border-zinc-800/80 flex items-center justify-between gap-4 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shadow-inner">
              <span className="text-base">🛠️</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
                  Centre de Débogage & Terminal
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  DevTools
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Édition directe des fichiers JSON du site & Terminal shell zsh
              </p>
            </div>
          </div>

          {/* Tab Selector & Window Controls */}
          <div className="flex items-center gap-2">
            
            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-zinc-950/80 border border-zinc-800 rounded-xl">
              <button
                onClick={() => setActiveTab('json')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'json'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fichiers JSON</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('terminal');
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'terminal'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <TerminalIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Terminal zsh</span>
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? "Réduire" : "Plein écran"}
              className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              title="Fermer (Échap)"
              className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden flex flex-col p-4">

          {/* ========================================================= */}
          {/* TAB 1: JSON FILES MANAGER & EDITOR */}
          {/* ========================================================= */}
          {activeTab === 'json' && (
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
              
              {/* File Selection Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
                
                {/* File Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                  {fileList.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => loadFile(file.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                        selectedFileKey === file.id
                          ? 'bg-zinc-800 text-emerald-400 border-emerald-500/40 shadow-sm'
                          : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border-zinc-800 hover:bg-zinc-850'
                      }`}
                    >
                      <FileCode2 className="w-3.5 h-3.5" />
                      <span>{file.name}</span>
                      {selectedFileKey === file.id && isDirty && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Modifications non enregistrées"></span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Editor Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrettify}
                    title="Formater le JSON avec 2 espaces"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Formater</span>
                  </button>

                  <button
                    onClick={handleCopyJson}
                    title="Copier le contenu"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                    <span>{copied ? 'Copié' : 'Copier'}</span>
                  </button>

                  <button
                    onClick={() => loadFile(selectedFileKey)}
                    title="Recharger depuis le disque (annuler les modifications)"
                    className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700/60 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  {/* Save to Disk Button */}
                  <button
                    onClick={handleSaveJson}
                    disabled={isSavingFile || Boolean(jsonError)}
                    title="Sauvegarder directement dans le fichier sur disque"
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                      jsonError
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/40'
                        : isDirty
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-950/30'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                    }`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingFile ? 'Enregistrement...' : 'Sauvegarder'}</span>
                  </button>
                </div>

              </div>

              {/* Status / Alert Bar */}
              <div className="flex items-center justify-between gap-3 text-[11px] font-mono px-1">
                <div className="flex items-center gap-3 text-zinc-400 truncate">
                  <span>📂 {currentFileMeta?.path || selectedFileKey}</span>
                  {currentFileMeta && (
                    <span>• {(currentFileMeta.size / 1024).toFixed(1)} Ko</span>
                  )}
                  {isDirty && (
                    <span className="text-amber-400 font-bold">• Non sauvegardé</span>
                  )}
                </div>

                <div>
                  {jsonError ? (
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{jsonError}</span>
                    </span>
                  ) : saveSuccessMsg ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1 animate-pulse">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{saveSuccessMsg}</span>
                    </span>
                  ) : (
                    <span className="text-emerald-500/80 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>JSON Valide</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Code Textarea Editor */}
              <div className="flex-1 relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-inner">
                {isLoadingFile ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 text-zinc-400 text-xs">
                    Chargement du fichier JSON...
                  </div>
                ) : (
                  <textarea
                    value={fileContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    onKeyDown={handleKeyDownEditor}
                    spellCheck={false}
                    className="w-full h-full p-4 font-mono text-xs sm:text-sm text-emerald-300 bg-zinc-950 resize-none focus:outline-none selection:bg-emerald-500 selection:text-zinc-950 leading-relaxed scrollbar-thin"
                    placeholder="Contenu JSON..."
                  />
                )}
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: INTERACTIVE ZSH TERMINAL */}
          {/* ========================================================= */}
          {activeTab === 'terminal' && (
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
              
              {/* Useful Command Suggestions Bar */}
              <div className="space-y-1.5 pb-2 border-b border-zinc-800/80">
                <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Commandes utiles (cliquez pour exécuter directement) :</span>
                </span>
                
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                  {USEFUL_COMMANDS.map((item) => (
                    <button
                      key={item.cmd}
                      onClick={() => executeCommand(item.cmd)}
                      title={item.desc}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 border border-zinc-800 hover:border-zinc-700 transition-colors whitespace-nowrap cursor-pointer shrink-0"
                    >
                      {item.cmd}
                    </button>
                  ))}
                </div>
              </div>

              {/* Terminal Screen Container */}
              <div className="flex-1 rounded-2xl bg-black border border-zinc-800/90 shadow-2xl flex flex-col overflow-hidden font-mono text-xs">
                
                {/* Traffic Light Dots Bar */}
                <div className="px-4 py-2 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                    <span className="text-zinc-500 text-[11px] ml-2 font-mono">
                      romainrigal@MacBook-Pro: ~/Class Dashboard (zsh)
                    </span>
                  </div>

                  <button
                    onClick={() => setHistory([])}
                    title="Nettoyer l'historique"
                    className="text-zinc-500 hover:text-zinc-300 text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>

                {/* Output History Area */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin text-zinc-200">
                  {history.map((entry) => (
                    <div key={entry.id} className="space-y-1">
                      {/* Command Line Prompt */}
                      <div className="flex items-center gap-2 text-zinc-400">
                        <span className="text-emerald-400 font-bold">➜</span>
                        <span className="text-indigo-400 font-bold">Class Dashboard</span>
                        <span className="text-zinc-500">git:(main)</span>
                        <span className="text-white font-bold">$ {entry.command}</span>
                        <span className="text-[10px] text-zinc-600 ml-auto">{entry.timestamp}</span>
                      </div>

                      {/* Stdout Output */}
                      {entry.stdout && (
                        <pre className="whitespace-pre-wrap text-emerald-300 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-900 leading-relaxed font-mono">
                          {entry.stdout}
                        </pre>
                      )}

                      {/* Stderr Output */}
                      {entry.stderr && (
                        <pre className="whitespace-pre-wrap text-rose-400 bg-rose-950/20 p-2.5 rounded-xl border border-rose-900/40 leading-relaxed font-mono">
                          {entry.stderr}
                        </pre>
                      )}
                    </div>
                  ))}

                  {/* Running Indicator */}
                  {isExecutingCmd && (
                    <div className="flex items-center gap-2 text-zinc-400 italic">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Exécution de la commande en cours...</span>
                    </div>
                  )}

                  <div ref={terminalEndRef} />
                </div>

                {/* Command Input Bar */}
                <form 
                  onSubmit={handleTerminalSubmit}
                  className="px-4 py-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2"
                >
                  <span className="text-emerald-400 font-bold shrink-0">➜ $</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    onKeyDown={handleTerminalKeyDown}
                    placeholder="Entrez une commande (ex: git status, npm run build, ls -la...)"
                    className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none placeholder-zinc-600"
                    disabled={isExecutingCmd}
                  />
                  <button
                    type="submit"
                    disabled={isExecutingCmd || !commandInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-600 font-bold text-xs transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run</span>
                  </button>
                </form>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
