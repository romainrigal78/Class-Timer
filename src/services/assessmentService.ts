import initialQuizzes from '../data/quizzes.json';

export type AssessmentType = 'quizz' | 'interro' | 'partiel' | 'examen' | 'devoir' | 'projet';

export interface Assessment {
  id: string;
  title: string;
  subject: string;
  type: AssessmentType;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location?: string;
  coefficient?: number;
  comment: string;
  status: 'upcoming' | 'completed';
  createdAt: string;
}

const STORAGE_KEY = 'univ_dashboard_assessments_data';

export const ASSESSMENT_TYPE_CONFIG: Record<
  AssessmentType,
  { label: string; badgeClass: string; borderClass: string; icon: string }
> = {
  quizz: {
    label: 'Quizz',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    borderClass: 'border-emerald-500/30',
    icon: '⚡',
  },
  interro: {
    label: 'Interrogation',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    borderClass: 'border-amber-500/30',
    icon: '📝',
  },
  partiel: {
    label: 'Partiel',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    borderClass: 'border-rose-500/30',
    icon: '🎓',
  },
  examen: {
    label: 'Examen',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20',
    borderClass: 'border-red-500/30',
    icon: '🚨',
  },
  devoir: {
    label: 'Devoir / TP',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    borderClass: 'border-blue-500/30',
    icon: '💻',
  },
  projet: {
    label: 'Projet / Soutenance',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    borderClass: 'border-purple-500/30',
    icon: '🎯',
  },
};

/**
 * Loads assessments from localStorage or defaults to initialQuizzes.
 */
export function getAssessments(): Assessment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort(sortAssessments);
      }
    }
  } catch (err) {
    console.warn('Erreur lecture assessments localStorage:', err);
  }

  const seeded = initialQuizzes as Assessment[];
  saveAssessmentsToStorage(seeded);
  return seeded.sort(sortAssessments);
}

/**
 * Saves assessments array to localStorage and syncs with server API.
 */
export function saveAssessments(items: Assessment[]): void {
  const sorted = [...items].sort(sortAssessments);
  saveAssessmentsToStorage(sorted);
  syncWithServer(sorted);
}

function saveAssessmentsToStorage(items: Assessment[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Erreur écriture assessments localStorage:', err);
  }
}

function syncWithServer(items: Assessment[]): void {
  fetch('/api/quizzes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
  }).catch(() => {
    // Offline or server not handling it, localStorage is safe source of truth
  });
}

/**
 * Creates or updates an assessment item.
 */
export function upsertAssessment(item: Omit<Assessment, 'id' | 'createdAt'> & { id?: string }): Assessment {
  const current = getAssessments();
  let updatedItem: Assessment;

  if (item.id) {
    // Update existing
    updatedItem = {
      ...item,
      id: item.id,
      createdAt: current.find((a) => a.id === item.id)?.createdAt || new Date().toISOString(),
    };
    const updatedList = current.map((a) => (a.id === item.id ? updatedItem : a));
    saveAssessments(updatedList);
  } else {
    // Create new
    updatedItem = {
      ...item,
      id: `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    saveAssessments([updatedItem, ...current]);
  }

  return updatedItem;
}

/**
 * Deletes an assessment by ID.
 */
export function deleteAssessment(id: string): void {
  const current = getAssessments();
  const filtered = current.filter((a) => a.id !== id);
  saveAssessments(filtered);
}

/**
 * Toggles status between 'upcoming' and 'completed'.
 */
export function toggleAssessmentStatus(id: string): void {
  const current = getAssessments();
  const updated = current.map((a) => {
    if (a.id === id) {
      return {
        ...a,
        status: a.status === 'completed' ? ('upcoming' as const) : ('completed' as const),
      };
    }
    return a;
  });
  saveAssessments(updated);
}

/**
 * Imports JSON string with validation.
 */
export function importAssessmentsFromJson(jsonStr: string): Assessment[] {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      throw new Error('Le JSON doit être une liste (tableau d\'évaluations).');
    }

    const validated: Assessment[] = parsed.map((item, index) => {
      if (!item.title || !item.date) {
        throw new Error(`L'élément #${index + 1} doit au moins comporter un titre et une date.`);
      }
      return {
        id: item.id || `quiz-imported-${Date.now()}-${index}`,
        title: String(item.title),
        subject: item.subject ? String(item.subject) : 'Général',
        type: (['quizz', 'interro', 'partiel', 'examen', 'devoir', 'projet'].includes(item.type)
          ? item.type
          : 'quizz') as AssessmentType,
        date: String(item.date),
        time: item.time ? String(item.time) : '08:00',
        location: item.location ? String(item.location) : undefined,
        coefficient: typeof item.coefficient === 'number' ? item.coefficient : 1,
        comment: item.comment ? String(item.comment) : '',
        status: item.status === 'completed' ? 'completed' : 'upcoming',
        createdAt: item.createdAt || new Date().toISOString(),
      };
    });

    saveAssessments(validated);
    return validated;
  } catch (err: any) {
    throw new Error(`Format JSON invalide: ${err.message}`);
  }
}

/**
 * Returns formatted relative countdown badge information.
 */
export function getAssessmentCountdown(dateStr: string, timeStr: string = '00:00'): {
  diffDays: number;
  label: string;
  badgeClass: string;
  isUrgent: boolean;
  isPast: boolean;
} {
  const now = new Date();
  const target = new Date(`${dateStr}T${timeStr}:00`);

  // Reset time on now for day comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((targetDay.getTime() - today.getTime()) / msPerDay);

  if (diffDays < 0) {
    return {
      diffDays,
      label: `Passé (${Math.abs(diffDays)} j)`,
      badgeClass: 'bg-zinc-800 text-zinc-500 border-zinc-700/50',
      isUrgent: false,
      isPast: true,
    };
  }

  if (diffDays === 0) {
    return {
      diffDays,
      label: "🚨 Aujourd'hui !",
      badgeClass: 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse font-bold',
      isUrgent: true,
      isPast: false,
    };
  }

  if (diffDays === 1) {
    return {
      diffDays,
      label: '⚡ Demain !',
      badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold',
      isUrgent: true,
      isPast: false,
    };
  }

  if (diffDays <= 3) {
    return {
      diffDays,
      label: `Dans ${diffDays} jours`,
      badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30 font-semibold',
      isUrgent: true,
      isPast: false,
    };
  }

  if (diffDays <= 7) {
    return {
      diffDays,
      label: `Dans ${diffDays} jours`,
      badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20 font-medium',
      isUrgent: false,
      isPast: false,
    };
  }

  return {
    diffDays,
    label: `Dans ${diffDays} jours`,
    badgeClass: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/40 font-normal',
    isUrgent: false,
    isPast: false,
  };
}

function sortAssessments(a: Assessment, b: Assessment): number {
  const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
  const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
  return dateA - dateB;
}
