import React, { useState, useMemo, useRef } from 'react';
import { 
  CalendarCheck, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  FolderOpen, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Edit3, 
  FileText, 
  Table, 
  ChevronDown, 
  ChevronUp, 
  Award,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  type Assessment, 
  type AssessmentType, 
  ASSESSMENT_TYPE_CONFIG, 
  getAssessments, 
  upsertAssessment,
  deleteAssessment, 
  getAssessmentCountdown 
} from '../services/assessmentService';
import { openDesktopFolder } from '../services/icsService';
import { AssessmentModal } from './AssessmentModal';
import { AssessmentDatatableModal } from './AssessmentDatatableModal';

interface AssessmentAgendaProps {
  onRefreshData?: () => void;
}

export const AssessmentAgenda: React.FC<AssessmentAgendaProps> = () => {
  const [assessments, setAssessments] = useState<Assessment[]>(() => getAssessments());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDatatableOpen, setIsDatatableOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'upcoming' | 'urgent' | 'completed'>('all');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // Temporary toast for undoing quiz deletion
  const [deletedToast, setDeletedToast] = useState<{ id: string; title: string; item: Assessment } | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshList = () => {
    setAssessments(getAssessments());
  };

  const handleToggleStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const itemToDelete = assessments.find((a) => a.id === id);
    if (!itemToDelete) return;

    // Small celebratory confetti burst
    try {
      confetti({
        particleCount: 35,
        spread: 55,
        origin: { y: 0.7 },
        colors: ['#10b981', '#34d399', '#6ee7b7']
      });
    } catch {}

    // User requested: "supprime les quizz une fois marqué comme terminé"
    deleteAssessment(id);
    refreshList();

    // Show temporary undo toast for 6 seconds
    setDeletedToast({ id, title: itemToDelete.title, item: itemToDelete });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setDeletedToast(null);
    }, 6000);
  };

  const handleUndoDelete = () => {
    if (deletedToast) {
      upsertAssessment(deletedToast.item);
      refreshList();
      setDeletedToast(null);
    }
  };

  const handleDelete = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Supprimer l'évaluation "${title}" ?`)) {
      deleteAssessment(id);
      refreshList();
    }
  };

  const handleEdit = (assessment: Assessment, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAssessment(assessment);
    setIsAddModalOpen(true);
  };

  const toggleCommentExpansion = (id: string) => {
    setExpandedComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Stats calculation
  const stats = useMemo(() => {
    let upcomingCount = 0;
    let urgentCount = 0;
    let completedCount = 0;

    assessments.forEach((a) => {
      if (a.status === 'completed') {
        completedCount++;
      } else {
        upcomingCount++;
        const cd = getAssessmentCountdown(a.date, a.time);
        if (cd.isUrgent) urgentCount++;
      }
    });

    return { total: assessments.length, upcomingCount, urgentCount, completedCount };
  }, [assessments]);

  // Filtered List
  const filteredAssessments = useMemo(() => {
    return assessments.filter((a) => {
      // Status filter
      if (selectedStatusFilter === 'upcoming' && a.status !== 'upcoming') return false;
      if (selectedStatusFilter === 'completed' && a.status !== 'completed') return false;
      if (selectedStatusFilter === 'urgent') {
        if (a.status === 'completed') return false;
        const cd = getAssessmentCountdown(a.date, a.time);
        if (!cd.isUrgent) return false;
      }

      // Type filter
      if (selectedTypeFilter !== 'all' && a.type !== selectedTypeFilter) return false;

      // Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = a.title.toLowerCase().includes(q);
        const matchesSubject = a.subject.toLowerCase().includes(q);
        const matchesComment = a.comment.toLowerCase().includes(q);
        const matchesLocation = a.location?.toLowerCase().includes(q) || false;
        return matchesTitle || matchesSubject || matchesComment || matchesLocation;
      }

      return true;
    });
  }, [assessments, selectedStatusFilter, selectedTypeFilter, searchQuery]);

  return (
    <section id="agenda-evaluations" className="w-full max-w-4xl mx-auto my-8 px-4">
      {/* Header Container */}
      <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-xl p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/60">
          
          {/* Section Title & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-100 tracking-tight">
                  Agenda des Quizz & Évaluations
                </h2>
                {stats.urgentCount > 0 && (
                  <span className="animate-pulse px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                    {stats.urgentCount} imminent{stats.urgentCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Quizz, interrogations, partiels & notes de révision
              </p>
            </div>
          </div>

          {/* Action Buttons: Add Quiz + Open Datatable JSON */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <button
              onClick={() => {
                setEditingAssessment(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-950/20 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un Quizz</span>
            </button>

            <button
              onClick={() => setIsDatatableOpen(true)}
              title="Consulter et exporter la Datatable JSON"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/50 hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <Table className="w-3.5 h-3.5 text-indigo-400" />
              <span>Datatable JSON</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 pb-4">
          <button
            onClick={() => setSelectedStatusFilter('all')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedStatusFilter === 'all'
                ? 'bg-zinc-800/90 border-zinc-600 shadow-sm'
                : 'bg-zinc-950/40 border-zinc-800/50 hover:bg-zinc-800/40'
            }`}
          >
            <span className="text-[11px] text-zinc-400 block font-medium">Total</span>
            <span className="text-lg font-bold text-zinc-100">{stats.total}</span>
          </button>

          <button
            onClick={() => setSelectedStatusFilter('upcoming')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedStatusFilter === 'upcoming'
                ? 'bg-blue-500/10 border-blue-500/40 shadow-sm'
                : 'bg-zinc-950/40 border-zinc-800/50 hover:bg-zinc-800/40'
            }`}
          >
            <span className="text-[11px] text-blue-400 block font-medium">À venir</span>
            <span className="text-lg font-bold text-blue-300">{stats.upcomingCount}</span>
          </button>

          <button
            onClick={() => setSelectedStatusFilter('urgent')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedStatusFilter === 'urgent'
                ? 'bg-red-500/15 border-red-500/40 shadow-sm'
                : 'bg-zinc-950/40 border-zinc-800/50 hover:bg-zinc-800/40'
            }`}
          >
            <span className="text-[11px] text-red-400 block font-medium">🚨 Imminents (&lt;3j)</span>
            <span className="text-lg font-bold text-red-400">{stats.urgentCount}</span>
          </button>

          <button
            onClick={() => setSelectedStatusFilter('completed')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedStatusFilter === 'completed'
                ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                : 'bg-zinc-950/40 border-zinc-800/50 hover:bg-zinc-800/40'
            }`}
          >
            <span className="text-[11px] text-emerald-400 block font-medium">Terminés</span>
            <span className="text-lg font-bold text-emerald-400">{stats.completedCount}</span>
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1 pb-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par titre, matière, révision, salle..."
              className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
              >
                ✕
              </button>
            )}
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedTypeFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedTypeFilter === 'all'
                  ? 'bg-zinc-700 text-white'
                  : 'bg-zinc-950/40 text-zinc-400 hover:text-zinc-200 border border-zinc-800/60'
              }`}
            >
              Tous
            </button>
            {(['quizz', 'interro', 'partiel', 'examen', 'devoir'] as AssessmentType[]).map((typeKey) => {
              const cfg = ASSESSMENT_TYPE_CONFIG[typeKey];
              return (
                <button
                  key={typeKey}
                  onClick={() => setSelectedTypeFilter(typeKey)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                    selectedTypeFilter === typeKey
                      ? 'bg-zinc-700 text-white'
                      : 'bg-zinc-950/40 text-zinc-400 hover:text-zinc-200 border border-zinc-800/60'
                  }`}
                >
                  <span>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Assessments Cards List */}
        <div className="space-y-3 mt-2">
          {filteredAssessments.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-xl border border-dashed border-zinc-800/80 bg-zinc-950/30">
              <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-400">Aucune évaluation correspondante</p>
              <p className="text-xs text-zinc-500 mt-1">
                {searchQuery || selectedTypeFilter !== 'all' || selectedStatusFilter !== 'all'
                  ? 'Essayez de réinitialiser vos filtres de recherche.'
                  : 'Vous n\'avez aucun quizz ou interro enregistré pour l\'instant.'}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTypeFilter('all');
                  setSelectedStatusFilter('all');
                  setEditingAssessment(null);
                  setIsAddModalOpen(true);
                }}
                className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Créer une première évaluation</span>
              </button>
            </div>
          ) : (
            filteredAssessments.map((item) => {
              const typeCfg = ASSESSMENT_TYPE_CONFIG[item.type] || ASSESSMENT_TYPE_CONFIG.quizz;
              const countdown = getAssessmentCountdown(item.date, item.time);
              const isCompleted = item.status === 'completed';
              const isExpanded = Boolean(expandedComments[item.id]);

              return (
                <div
                  key={item.id}
                  className={`group relative rounded-xl border transition-all duration-200 p-4 ${
                    isCompleted
                      ? 'bg-zinc-950/40 border-zinc-800/40 opacity-70 hover:opacity-100'
                      : countdown.isUrgent
                      ? 'bg-zinc-900/90 border-red-500/30 shadow-lg shadow-red-950/10 hover:border-red-500/50'
                      : 'bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-700/80 shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    
                    {/* Left: Checkbox + Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Status Toggle Button (Complete & Auto-delete) */}
                      <button
                        onClick={(e) => handleToggleStatus(item.id, e)}
                        title="Marquer comme terminé (supprime le quizz de l'agenda)"
                        className="mt-1 text-zinc-500 hover:text-emerald-400 transition-colors shrink-0 cursor-pointer group/check"
                      >
                        <div className="relative flex items-center justify-center">
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                          ) : (
                            <>
                              <Circle className="w-5 h-5 group-hover/check:text-emerald-400 transition-colors" />
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 opacity-0 group-hover/check:opacity-100 absolute transition-opacity" />
                            </>
                          )}
                        </div>
                      </button>

                      {/* Content block */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Badges line */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Type Badge */}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${typeCfg.badgeClass}`}>
                            <span>{typeCfg.icon}</span>
                            <span>{typeCfg.label}</span>
                          </span>

                          {/* Countdown badge */}
                          {!isCompleted && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] border ${countdown.badgeClass}`}>
                              {countdown.label}
                            </span>
                          )}

                          {/* Subject Pill with Folder launcher */}
                          <button
                            onClick={() => openDesktopFolder(item.subject)}
                            title={`Ouvrir le dossier Desktop : ${item.subject}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50 hover:text-emerald-400 transition-colors cursor-pointer"
                          >
                            <FolderOpen className="w-3 h-3 text-emerald-400" />
                            <span className="truncate max-w-[140px]">{item.subject}</span>
                          </button>

                          {/* Coefficient badge */}
                          {item.coefficient && item.coefficient > 1 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              <Award className="w-3 h-3" />
                              <span>Coeff: {item.coefficient}</span>
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className={`text-sm sm:text-base font-semibold text-zinc-100 tracking-tight leading-snug ${
                          isCompleted ? 'line-through text-zinc-400' : ''
                        }`}>
                          {item.title}
                        </h3>

                        {/* Date, Time & Location row */}
                        <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap pt-0.5">
                          <span className="flex items-center gap-1 font-medium text-zinc-300">
                            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                            {new Date(`${item.date}T00:00:00`).toLocaleDateString('fr-FR', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>

                          <span className="flex items-center gap-1 text-zinc-400 font-mono">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            {item.time}
                          </span>

                          {item.location && (
                            <span className="flex items-center gap-1 text-zinc-400">
                              <span>📍</span>
                              <span>{item.location}</span>
                            </span>
                          )}
                        </div>

                        {/* Comment / Revision Notes */}
                        {item.comment && item.comment.trim().length > 0 && (
                          <div className="pt-1.5">
                            <div 
                              onClick={() => toggleCommentExpansion(item.id)}
                              className="group/comment cursor-pointer text-xs bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-2 text-zinc-300 hover:border-zinc-700/80 transition-all"
                            >
                              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 mb-1">
                                <span className="flex items-center gap-1 text-emerald-400/90">
                                  <FileText className="w-3 h-3" /> Note & Programme de révision :
                                </span>
                                <span className="text-[10px] text-zinc-500 group-hover/comment:text-zinc-300">
                                  {isExpanded ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />}
                                </span>
                              </div>
                              <p className={`whitespace-pre-wrap leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                                {item.comment}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Action Buttons (Edit, Delete, Open Folder) */}
                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      <button
                        onClick={(e) => handleEdit(item, e)}
                        title="Modifier cette évaluation"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleDelete(item.id, item.title, e)}
                        title="Supprimer cette évaluation"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Undo Deleted Quiz Notification Banner */}
        {deletedToast && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs text-emerald-300 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 truncate">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">
                Évaluation « <strong>{deletedToast.title}</strong> » marquée comme terminée et supprimée de l'agenda.
              </span>
            </div>
            <button
              onClick={handleUndoDelete}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-[11px] shrink-0 transition-colors cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Annuler</span>
            </button>
          </div>
        )}

      </div>

      {/* Edit / Add Modal */}
      <AssessmentModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingAssessment(null);
        }}
        assessmentToEdit={editingAssessment}
        onSaved={refreshList}
      />

      {/* Datatable JSON Modal */}
      <AssessmentDatatableModal
        isOpen={isDatatableOpen}
        onClose={() => setIsDatatableOpen(false)}
        assessments={assessments}
        onDataChanged={refreshList}
      />
    </section>
  );
};
