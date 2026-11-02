import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Upload, 
  RotateCcw, 
  Table as TableIcon, 
  Code2, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle
} from 'lucide-react';
import { 
  type Assessment, 
  ASSESSMENT_TYPE_CONFIG, 
  saveAssessments, 
  importAssessmentsFromJson 
} from '../services/assessmentService';
import initialQuizzes from '../data/quizzes.json';

interface AssessmentDatatableModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessments: Assessment[];
  onDataChanged: () => void;
}

export const AssessmentDatatableModal: React.FC<AssessmentDatatableModalProps> = ({
  isOpen,
  onClose,
  assessments,
  onDataChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'table' | 'json'>('table');
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [showImportArea, setShowImportArea] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const jsonString = JSON.stringify(assessments, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quizzes-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleResetDefault = () => {
    if (window.confirm('Voulez-vous réinitialiser la base de données des quizz avec les valeurs par défaut ?')) {
      saveAssessments(initialQuizzes as Assessment[]);
      onDataChanged();
    }
  };

  const handleImportSubmit = () => {
    try {
      setImportError(null);
      importAssessmentsFromJson(jsonInput);
      setShowImportArea(false);
      setJsonInput('');
      onDataChanged();
    } catch (err: any) {
      setImportError(err.message || 'Erreur lors de l\'importation');
    }
  };

  const filteredAssessments = assessments.filter((a) => {
    const term = searchTerm.toLowerCase();
    return (
      a.title.toLowerCase().includes(term) ||
      a.subject.toLowerCase().includes(term) ||
      (a.comment && a.comment.toLowerCase().includes(term)) ||
      (a.location && a.location.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-100">Datatable JSON des Quizz & Évaluations</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {assessments.length} entrées
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Visualisation, recherche, export et import de votre base de données JSON
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action & Tab bar */}
        <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-950/30'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>Tableau ({assessments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'json'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-950/30'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Code JSON Brut</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all cursor-pointer"
              title="Copier le JSON dans le presse-papier"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié !' : 'Copier JSON'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all cursor-pointer"
              title="Télécharger le fichier quizzes.json"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Télécharger</span>
            </button>

            <button
              onClick={() => setShowImportArea(!showImportArea)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all cursor-pointer"
              title="Importer du JSON"
            >
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              <span>Importer</span>
            </button>

            <button
              onClick={handleResetDefault}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-amber-400 border border-zinc-700 transition-all cursor-pointer"
              title="Réinitialiser avec les quizz par défaut"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Import JSON Area if open */}
        {showImportArea && (
          <div className="p-4 bg-zinc-950 border-b border-zinc-800 animate-fadeIn space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300">
                Coller du code JSON pour importer / mettre à jour les quizz :
              </span>
              <button
                onClick={() => setShowImportArea(false)}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Fermer
              </button>
            </div>

            {importError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            <textarea
              rows={4}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='[ { "title": "Quizz 1", "subject": "Taxation", "type": "quizz", "date": "2026-10-30", "time": "10:00", "comment": "Chapitre 1" } ]'
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 resize-none"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={handleImportSubmit}
                className="px-4 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs hover:bg-emerald-400 transition-all cursor-pointer"
              >
                Valider l'importation JSON
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Interactive Table View */}
        {activeTab === 'table' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            
            {/* Filter Search */}
            <div className="p-3 bg-zinc-950/40 border-b border-zinc-800">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher par titre, matière, salle, commentaire..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider font-semibold sticky top-0 backdrop-blur-md">
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Titre & Matière</th>
                    <th className="py-2.5 px-4">Date & Heure</th>
                    <th className="py-2.5 px-4">Salle</th>
                    <th className="py-2.5 px-4">Coeff</th>
                    <th className="py-2.5 px-4">Commentaire</th>
                    <th className="py-2.5 px-4">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredAssessments.length > 0 ? (
                    filteredAssessments.map((a) => {
                      const typeConf = ASSESSMENT_TYPE_CONFIG[a.type] || ASSESSMENT_TYPE_CONFIG.quizz;
                      const isCompleted = a.status === 'completed';

                      return (
                        <tr 
                          key={a.id}
                          className={`hover:bg-zinc-800/40 transition-colors ${
                            isCompleted ? 'opacity-60 bg-zinc-950/30' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border font-bold text-[10px] ${typeConf.badgeClass}`}>
                              <span>{typeConf.icon}</span>
                              <span>{typeConf.label}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-zinc-100">{a.title}</div>
                            <div className="text-[11px] text-emerald-400 font-medium">📁 {a.subject}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-300">
                            <div>{a.date}</div>
                            <div className="text-[10px] text-zinc-500">{a.time}</div>
                          </td>
                          <td className="py-3 px-4 text-zinc-400">
                            {a.location || '—'}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-amber-400">
                            ×{a.coefficient ?? 1}
                          </td>
                          <td className="py-3 px-4 text-zinc-400 max-w-xs truncate" title={a.comment}>
                            {a.comment || '—'}
                          </td>
                          <td className="py-3 px-4">
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600" /> Fait
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                                <Clock className="w-3.5 h-3.5" /> À venir
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500 text-xs">
                        Aucun quizz ou interro ne correspond à votre recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Tab 2: Raw JSON View */}
        {activeTab === 'json' && (
          <div className="flex-1 overflow-y-auto p-4 bg-zinc-950 font-mono text-xs">
            <pre className="text-emerald-400/90 leading-relaxed selection:bg-emerald-500 selection:text-zinc-950">
              {jsonString}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
};
