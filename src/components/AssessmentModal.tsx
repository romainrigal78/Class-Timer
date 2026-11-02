import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Sparkles, 
  Calendar, 
  Clock, 
  MapPin, 
  BookOpen, 
  FileText, 
  Tag, 
  Award,
  AlertCircle
} from 'lucide-react';
import { 
  upsertAssessment, 
  type Assessment, 
  type AssessmentType,
  ASSESSMENT_TYPE_CONFIG 
} from '../services/assessmentService';
import { KNOWN_DESKTOP_FOLDERS } from '../services/icsService';

interface AssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentToEdit?: Assessment | null;
  onSaved: () => void;
}

export const AssessmentModal: React.FC<AssessmentModalProps> = ({
  isOpen,
  onClose,
  assessmentToEdit,
  onSaved,
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(KNOWN_DESKTOP_FOLDERS[0] || 'Management control');
  const [customSubject, setCustomSubject] = useState('');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [type, setType] = useState<AssessmentType>('quizz');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [coefficient, setCoefficient] = useState<number>(1);
  const [comment, setComment] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (assessmentToEdit) {
      setTitle(assessmentToEdit.title);
      if (KNOWN_DESKTOP_FOLDERS.includes(assessmentToEdit.subject)) {
        setSubject(assessmentToEdit.subject);
        setIsCustomSubject(false);
      } else {
        setIsCustomSubject(true);
        setCustomSubject(assessmentToEdit.subject);
      }
      setType(assessmentToEdit.type);
      setDate(assessmentToEdit.date);
      setTime(assessmentToEdit.time || '10:00');
      setLocation(assessmentToEdit.location || '');
      setCoefficient(assessmentToEdit.coefficient ?? 1);
      setComment(assessmentToEdit.comment || '');
    } else {
      // Default to 3 days from now
      const d = new Date();
      d.setDate(d.getDate() + 3);
      const defaultDateStr = d.toISOString().split('T')[0];

      setTitle('');
      setSubject('Management control');
      setIsCustomSubject(false);
      setCustomSubject('');
      setType('quizz');
      setDate(defaultDateStr);
      setTime('10:00');
      setLocation('');
      setCoefficient(1);
      setComment('');
    }
    setErrorMsg(null);
  }, [assessmentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Veuillez renseigner un titre pour cette évaluation.');
      return;
    }
    if (!date) {
      setErrorMsg('Veuillez sélectionner une date.');
      return;
    }

    const effectiveSubject = isCustomSubject ? customSubject.trim() || 'Général' : subject;

    upsertAssessment({
      id: assessmentToEdit?.id,
      title: title.trim(),
      subject: effectiveSubject,
      type,
      date,
      time: time || '08:00',
      location: location.trim() || undefined,
      coefficient: Number(coefficient) || 1,
      comment: comment.trim(),
      status: assessmentToEdit?.status || 'upcoming',
    });

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">
                {assessmentToEdit ? "Modifier l'évaluation" : "Ajouter un Quizz / Interro"}
              </h2>
              <p className="text-xs text-zinc-400">
                Agenda des quizz, interrogations et partiels
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          
          {/* Titre */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-400" /> Titre de l'évaluation *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Quizz Chapitre 3, Interro surprise, Partiel Mi-semestre..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-700/80 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-all font-medium"
            />
          </div>

          {/* Type d'évaluation */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Type d'épreuve
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {(Object.keys(ASSESSMENT_TYPE_CONFIG) as AssessmentType[]).map((t) => {
                const conf = ASSESSMENT_TYPE_CONFIG[t];
                const isSelected = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold transition-all text-center flex flex-col items-center gap-0.5 ${
                      isSelected
                        ? `${conf.badgeClass} ring-1 ring-emerald-500/50 scale-102`
                        : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:bg-zinc-800/60 hover:text-zinc-200'
                    }`}
                  >
                    <span>{conf.icon}</span>
                    <span className="truncate w-full">{conf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Matière / Dossier Desktop */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Matière associée
              </span>
              <button
                type="button"
                onClick={() => setIsCustomSubject(!isCustomSubject)}
                className="text-[11px] text-emerald-400 hover:underline cursor-pointer lowercase"
              >
                {isCustomSubject ? 'Choisir dans la liste' : '+ Autre matière'}
              </button>
            </label>

            {isCustomSubject ? (
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Nom personnalisé de la matière..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-700/80 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-all"
              />
            ) : (
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-700/80 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
              >
                {KNOWN_DESKTOP_FOLDERS.map((folder) => (
                  <option key={folder} value={folder} className="bg-zinc-900 text-zinc-100">
                    📁 {folder}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date & Heure */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950/80 border border-zinc-700/80 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Heure
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950/80 border border-zinc-700/80 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Salle & Coeff */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-400" /> Salle (optionnel)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: PARC-C501, Amphi..."
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950/80 border border-zinc-700/80 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" /> Coefficient
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="10"
                value={coefficient}
                onChange={(e) => setCoefficient(parseFloat(e.target.value) || 1)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950/80 border border-zinc-700/80 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Commentaire / Consignes de révision */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" /> Remarques / Chapitres à réviser
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ex: Chapitres 1 à 4. Formules de calcul des écarts de coûts. Calculatrice collège autorisée. Barème sur 20..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-700/80 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-all cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-zinc-950 shadow-md shadow-emerald-950/30 transition-all active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{assessmentToEdit ? 'Mettre à jour' : 'Enregistrer le quizz'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
