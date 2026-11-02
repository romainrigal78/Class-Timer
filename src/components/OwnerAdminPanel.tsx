import React, { useState } from 'react';
import { 
  getRegisteredUsers, 
  getLoginAttempts, 
  type LoginAttempt, 
  type UserProfile 
} from '../services/keyauthService';
import { 
  Crown, 
  X, 
  Users, 
  Activity, 
  ShieldCheck, 
  ShieldAlert, 
  Globe, 
  Laptop, 
  Search, 
  RefreshCw,
  School
} from 'lucide-react';

interface OwnerAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
}

export const OwnerAdminPanel: React.FC<OwnerAdminPanelProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'users'>('logs');
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<LoginAttempt[]>(() => getLoginAttempts());
  const [users, setUsers] = useState<UserProfile[]>(() => getRegisteredUsers());

  if (!isOpen || currentUser.username.toLowerCase() !== 'roman') return null;

  const handleRefresh = () => {
    setLogs(getLoginAttempts());
    setUsers(getRegisteredUsers());
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.ipAddress.includes(searchTerm) ||
      l.browser.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.os.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.school.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl bg-zinc-900 border border-amber-500/30 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Crown className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-100">Panneau de Contrôle Owner</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Réservé à {currentUser.username}
                </span>
              </div>
              <p className="text-xs text-zinc-400">Supervision des connexions KeyAuth & utilisateurs inscrits</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
              title="Actualiser les données"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection & Search Bar */}
        <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'logs'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-950/30'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Tentatives de Connexion ({logs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'users'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-950/30'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Utilisateurs Inscrits ({users.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrer par IP, nom, OS..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        {/* Tab 1: Logs List */}
        {activeTab === 'logs' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 rounded-2xl border text-xs transition-all ${
                    log.status === 'SUCCESS'
                      ? 'bg-zinc-950/60 border-emerald-500/20'
                      : 'bg-zinc-950/60 border-red-500/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {log.status === 'SUCCESS' ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-bold text-zinc-100">{log.username}</strong>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {log.status === 'SUCCESS' ? 'Connexion Réussie' : 'Échec Connexion'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                          {new Date(log.timestamp).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-zinc-400 text-[11px]">
                      <span className="flex items-center gap-1 bg-zinc-800/60 px-2.5 py-1 rounded-lg border border-zinc-700/50">
                        <Globe className="w-3.5 h-3.5 text-amber-400" /> IP: {log.ipAddress}
                      </span>
                      <span className="flex items-center gap-1 bg-zinc-800/60 px-2.5 py-1 rounded-lg border border-zinc-700/50">
                        <Laptop className="w-3.5 h-3.5 text-blue-400" /> {log.os} • {log.browser}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500 font-mono truncate">
                    User-Agent: {log.userAgent}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-zinc-500">
                Aucune tentative de connexion trouvée.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Users List */}
        {activeTab === 'users' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <div
                  key={u.username}
                  className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${
                      u.role === 'owner'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                    }`}>
                      {u.role === 'owner' ? <Crown className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-zinc-100">{u.username}</strong>
                        {u.role === 'owner' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Owner
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 bg-zinc-800/60 px-3 py-1 rounded-xl border border-zinc-700/50 text-zinc-300 font-bold">
                      <School className="w-3.5 h-3.5 text-emerald-400" /> {u.school}
                    </span>
                    {u.year && (
                      <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-xl border border-emerald-500/20 font-mono font-bold">
                        {u.year} {u.group || ''}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-zinc-500">
                Aucun utilisateur inscrit correspondant.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
