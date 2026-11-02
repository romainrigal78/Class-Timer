import React, { useState } from 'react';
import { 
  keyauthLogin, 
  keyauthRegister, 
  keyauthLicenseLogin, 
  type UserProfile 
} from '../services/keyauthService';
import { 
  ShieldCheck, 
  User, 
  Lock, 
  Mail, 
  Calendar, 
  School, 
  Key, 
  Sparkles, 
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Crown
} from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'license'>('login');

  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [school, setSchool] = useState<'EMLV' | 'IIM' | 'ESILV'>('EMLV');
  const [licenseKey, setLicenseKey] = useState('');

  // Status States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const user = await keyauthLogin(username, password);
      onAuthSuccess(user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Échec de la connexion KeyAuth.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const user = await keyauthRegister({
        username,
        email,
        password,
        dob,
        school,
      });
      onAuthSuccess(user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Échec de l\'inscription KeyAuth.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLicenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const user = await keyauthLicenseLogin(licenseKey);
      onAuthSuccess(user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Clé de licence invalide.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill test account handlers
  const handleQuickLoginOwner = () => {
    setUsername('roman');
    setPassword('roman123');
    setActiveTab('login');
  };

  const handleQuickLoginStudent = () => {
    setUsername('testuser');
    setPassword('test1234');
    setActiveTab('login');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-zinc-950 relative overflow-hidden">
      
      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-subtle" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-subtle" />

      <div className="relative w-full max-w-md rounded-3xl bg-zinc-900/80 border border-zinc-800/80 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl transition-all duration-300">
        
        {/* Header Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700/60 shadow-inner text-emerald-400 mb-3 group">
            <ShieldCheck className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
            KeyAuth Portal
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Application <strong className="text-zinc-200 font-mono">Management</strong> • Devinci Class Dashboard
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'login'
                ? 'bg-zinc-800 text-emerald-400 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setErrorMsg(null); }}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'register'
                ? 'bg-zinc-800 text-emerald-400 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Inscription
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('license'); setErrorMsg(null); }}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'license'
                ? 'bg-zinc-800 text-emerald-400 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Clé API
          </button>
        </div>

        {/* Error Notification Banner */}
        {errorMsg && (
          <div className="mb-5 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-xs text-red-400 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form 1: Connexion */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" /> Nom d'utilisateur
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: roman ou testuser"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-700/80 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> Mot de passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-700/80 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Verification KeyAuth...</span>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Form 2: Inscription */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" /> Nom d'utilisateur
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Votre pseudo KeyAuth"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-700/80 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" /> Adresse Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@devinci.fr"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-700/80 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> Mot de passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-700/80 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Date de Naissance
                </label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950/80 border border-zinc-700/80 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-emerald-400" /> École
                </label>
                <select
                  value={school}
                  onChange={(e) => setSchool(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950/80 border border-zinc-700/80 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition-all"
                >
                  <option value="EMLV">EMLV (Management)</option>
                  <option value="IIM">IIM (Digital)</option>
                  <option value="ESILV">ESILV (Ingénieur)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <span>Création de compte KeyAuth...</span>
              ) : (
                <>
                  <span>Créer mon compte</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Form 3: Clé de licence */}
        {activeTab === 'license' && (
          <form onSubmit={handleLicenseSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" /> Clé de Licence KeyAuth
              </label>
              <input
                type="text"
                required
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="Ex: XXXX-XXXX-XXXX-XXXX"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-700/80 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Vérification de la clé...</span>
              ) : (
                <>
                  <span>Activer la licence</span>
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Quick Test Accounts Section */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Comptes de test pré-remplis
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleQuickLoginOwner}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-bold transition-all"
            >
              <Crown className="w-3.5 h-3.5" /> Owner (roman)
            </button>
            <button
              type="button"
              onClick={handleQuickLoginStudent}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-xs font-bold transition-all"
            >
              <User className="w-3.5 h-3.5" /> Student (testuser)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
