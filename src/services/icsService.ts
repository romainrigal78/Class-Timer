import ICAL from 'ical.js';
import localCoursesData from '../data/_courses_data.json';

export interface Course {
  id: string;
  title: string;
  cleanTitle: string;
  room: string;
  teacher: string;
  start: Date;
  end: Date;
  rawDescription?: string;
  zoomUrl?: string;
  matchedFolder?: string;
  folderUrl?: string;
}

export const KNOWN_DESKTOP_FOLDERS: string[] = [
  'Advanced Excel',
  'Basics of negotiation',
  'Business Law',
  'Cooperation en equipe',
  'Espagnol',
  'Ethics and CSR',
  'Etudes de Marche',
  'Financial accounting 2',
  'Financial mathematics',
  'Fundament Information Systems',
  'Management control',
  'Marketing Strategy',
  'Taxation',
  'A1 - Semestre 1',
  'A2 - Semestre 2',
];

export const DESKTOP_ROOT_PATH = '/Users/romainrigal/Desktop';

/**
 * Triggers native macOS Finder opening for the specified Desktop folder name via Vite dev API endpoint.
 */
export function openDesktopFolder(folderName?: string): void {
  const folder = folderName || '';
  const folderPath = folder ? `${DESKTOP_ROOT_PATH}/${folder}` : DESKTOP_ROOT_PATH;

  fetch(`/api/open-folder?folder=${encodeURIComponent(folder)}`)
    .catch((err) => console.warn('Erreur ouverture dossier via API:', err));

  try {
    navigator.clipboard.writeText(folderPath);
  } catch {
    // Silent fallback
  }
}

const STOPWORDS = new Set([
  'to', 'and', 'the', 'of', 'in', 'for', 'a', 'an', 'ini', 'intro', 
  'introduction', 'catch', 'up', 'prepa', 'prep', '1', '2', '3', 'examen', 'rattrapage'
]);

export function cleanCourseTitle(rawSummary?: string): string {
  if (!rawSummary) return 'Cours sans titre';
  return rawSummary
    .replace(/\[[A-Za-z0-9_ -]+\]/g, ' ')
    .replace(/(Enseignant|Professeur)\s*:\s*[^\n\r]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchDesktopFolder(rawSummary: string, availableFolders: string[] = KNOWN_DESKTOP_FOLDERS): string | undefined {
  if (!rawSummary) return undefined;
  const t = rawSummary.toLowerCase();
  
  const enrichedRules = [
    { keywords: ["management control", "contrôle de gestion", "controle de gestion"], folder: "Management control" },
    { keywords: ["taxation", "fiscalite", "fiscalité", "tax"], folder: "Taxation" },
    { keywords: ["excel", "collab tools"], folder: "Advanced Excel" },
    { keywords: ["negotiation", "negociation", "négociation"], folder: "Basics of negotiation" },
    { keywords: ["business law", "labour law", "droit", "law", "legal"], folder: "Business Law" },
    { keywords: ["coopération", "cooperation", "equipe", "équipe", "intelligence collective", "efficacité indiv", "efficacite indiv"], folder: "Cooperation en equipe" },
    { keywords: ["espagnol", "spanish"], folder: "Espagnol" },
    { keywords: ["ethics", "csr", "rse", "ethique", "éthique", "sustainable", "climate", "transitions", "geopolitics"], folder: "Ethics and CSR" },
    { keywords: ["etudes de marche", "études de marché", "market studies", "vente", "démarche commerciale", "recherche de stage"], folder: "Etudes de Marche" },
    { keywords: ["accounting", "comptabilite", "compta"], folder: "Financial accounting 2" },
    { keywords: ["mathematics", "math", "maths", "stock exchange", "finance", "micro-economics", "micro-économie"], folder: "Financial mathematics" },
    { keywords: ["information systems", "fundamentals management", "fundamentals marketing", "systemes d information", "coding", "fablab", "ai & work", "ia & work", "design thinking", "initiation to ai", "initiation to coding"], folder: "Fundament Information Systems" },
    { keywords: ["marketing strategy", "marketing", "selling", "produits innovants", "innovating products"], folder: "Marketing Strategy" },
    { keywords: ["hackathon", "internship y1", "stage a1", "a1"], folder: "A1 - Semestre 1" },
    { keywords: ["semestre 2", "stage a2", "a2"], folder: "A2 - Semestre 2" }
  ];

  for (const rule of enrichedRules) {
    if (rule.keywords.some(k => t.includes(k))) {
      return rule.folder;
    }
  }

  const normalize = (str: string) => 
    str.toLowerCase()
       .normalize('NFD')
       .replace(/[\u0300-\u036f]/g, '')
       .replace(/[^a-z0-9\s]/g, ' ');

  const getTokens = (str: string) => 
    normalize(str)
      .split(/\s+/)
      .filter(t => t.length > 1 && !STOPWORDS.has(t));

  const titleTokens = getTokens(cleanCourseTitle(rawSummary));

  let bestFolder: string | undefined = undefined;
  let highestScore = 0;

  for (const folder of availableFolders) {
    const folderTokens = getTokens(folder);
    if (folderTokens.length === 0) continue;

    const folderLower = normalize(folder);
    const titleLower = normalize(cleanCourseTitle(rawSummary));

    if (titleLower.includes(folderLower) || folderLower.includes(titleLower)) {
      return folder;
    }

    let score = 0;
    for (const tToken of titleTokens) {
      for (const fToken of folderTokens) {
        if (tToken === fToken) {
          score += 3;
        } else if (tToken.includes(fToken) || fToken.includes(tToken)) {
          if (Math.min(tToken.length, fToken.length) >= 4) {
            score += 2;
          }
        }
      }
    }

    if (score > highestScore && score >= 2) {
      highestScore = score;
      bestFolder = folder;
    }
  }

  return bestFolder;
}

export function extractTeacher(description?: string): string {
  if (!description) return 'Enseignant non spécifié';
  
  const primaryRegex = /(?:Enseignant|Professeur)\s*:\s*([^\n\r]+)/i;
  const match = description.match(primaryRegex);
  if (match && match[1]?.trim()) {
    return match[1].trim();
  }

  const fallbackRegex = /(?:Intervenant|Enseignants?|Prof)\s*:\s*([^\n\r]+)/i;
  const fallbackMatch = description.match(fallbackRegex);
  if (fallbackMatch && fallbackMatch[1]?.trim()) {
    return fallbackMatch[1].trim();
  }

  return 'Enseignant non spécifié';
}

export function extractZoomUrl(description?: string, location?: string): string | undefined {
  const combined = `${description || ''} ${location || ''}`;
  const zoomRegex = /(https:\/\/[a-zA-Z0-9-]+\.zoom\.us\/j\/[^\s\n\r"'>]+)/i;
  const match = combined.match(zoomRegex);
  return match ? match[1] : undefined;
}

export function getLocalDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLocalExtractedCourses(): Course[] {
  return localCoursesData.map((item: any) => {
    const matchedFolder = matchDesktopFolder(item.titreBrut) || item.dossierDesktop;
    const folderUrl = matchedFolder 
      ? `file://${DESKTOP_ROOT_PATH}/${encodeURIComponent(matchedFolder)}`
      : `file://${DESKTOP_ROOT_PATH}`;

    return {
      id: item.id,
      title: item.titreBrut,
      cleanTitle: item.nom,
      room: item.salle,
      teacher: item.prof,
      start: new Date(item.debutIso),
      end: new Date(item.finIso),
      rawDescription: item.titreBrut,
      zoomUrl: item.zoomUrl || undefined,
      matchedFolder: matchedFolder,
      folderUrl: folderUrl,
    };
  }).sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function generateDemoCourses(): Course[] {
  const now = new Date();

  const createDate = (hourOffset: number, minuteOffset: number = 0): Date => {
    const d = new Date(now);
    d.setHours(d.getHours() + hourOffset, d.getMinutes() + minuteOffset, 0, 0);
    return d;
  };

  const rawTitles = [
    '[MEMLDF23E126]Financial accounting 2 [CA]PALTALIDIS Nikos',
    '[MEMLDF23E526]Introduction to taxation [CA]PRESCOTT Jason',
    '[MEMLDM23E326]Basics of negotiation [CA]ALHUSSAN Fawaz',
    '[MEMLDM23E226]Marketing Strategy [CMo]ISHAQ Muhammad',
  ];

  return [
    {
      id: 'demo-1',
      title: rawTitles[0],
      cleanTitle: cleanCourseTitle(rawTitles[0]),
      room: 'Salle L302 - Pôle Vinci',
      teacher: 'PALTALIDIS Nikos',
      start: createDate(-3),
      end: createDate(-0.5),
      rawDescription: 'Enseignant : PALTALIDIS Nikos\nSupport sur Portal.',
      matchedFolder: 'Financial accounting 2',
      folderUrl: `file://${DESKTOP_ROOT_PATH}/Financial%20accounting%202`,
    },
    {
      id: 'demo-2',
      title: rawTitles[1],
      cleanTitle: cleanCourseTitle(rawTitles[1]),
      room: 'Amphi Arche 402',
      teacher: 'PRESCOTT Jason',
      start: createDate(-0.5),
      end: createDate(1),
      rawDescription: 'Enseignant : PRESCOTT Jason\nZoom: https://devinci-online.zoom.us/j/81679182324?pwd=XT791mEGCXgT6nh4StkVkXBrlYruI6.1',
      zoomUrl: 'https://devinci-online.zoom.us/j/81679182324?pwd=XT791mEGCXgT6nh4StkVkXBrlYruI6.1',
      matchedFolder: 'Taxation',
      folderUrl: `file://${DESKTOP_ROOT_PATH}/Taxation`,
    },
    {
      id: 'demo-3',
      title: rawTitles[2],
      cleanTitle: cleanCourseTitle(rawTitles[2]),
      room: 'Salle Co-working B201',
      teacher: 'ALHUSSAN Fawaz',
      start: createDate(1.25),
      end: createDate(3.25),
      rawDescription: 'Enseignant : ALHUSSAN Fawaz',
      matchedFolder: 'Basics of negotiation',
      folderUrl: `file://${DESKTOP_ROOT_PATH}/Basics%20of%20negotiation`,
    },
    {
      id: 'demo-4',
      title: rawTitles[3],
      cleanTitle: cleanCourseTitle(rawTitles[3]),
      room: 'Salle E312',
      teacher: 'ISHAQ Muhammad',
      start: createDate(3.5),
      end: createDate(5),
      rawDescription: 'Enseignant : ISHAQ Muhammad',
      matchedFolder: 'Marketing Strategy',
      folderUrl: `file://${DESKTOP_ROOT_PATH}/Marketing%20Strategy`,
    },
  ];
}

export function fetchAndParseICS(icsUrl: string): Promise<Course[]> {
  if (!icsUrl || icsUrl.trim() === '') {
    return Promise.resolve(getLocalExtractedCourses());
  }

  const cleanUrl = icsUrl.trim();
  const proxyUrlPrimary = `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`;
  const proxyUrlFallback = `https://corsproxy.io/?${encodeURIComponent(cleanUrl)}`;

  const tryFetch = (url: string): Promise<string> => {
    return fetch(url).then((res) => {
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return res.text();
    });
  };

  return tryFetch(proxyUrlPrimary)
    .catch(() => tryFetch(proxyUrlFallback))
    .catch(() => tryFetch(cleanUrl))
    .then((icsData) => {
      const parsedCourses = parseICSContent(icsData);
      if (parsedCourses.length === 0) {
        throw new Error('Aucun cours trouvé dans le fichier ICS');
      }
      return parsedCourses;
    })
    .catch(() => {
      return getLocalExtractedCourses();
    });
}

export function parseICSContent(icsData: string): Course[] {
  try {
    const jcalData = ICAL.parse(icsData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    const courses: Course[] = vevents.map((vevent: ICAL.Component, index: number) => {
      const event = new ICAL.Event(vevent);
      
      const summary = event.summary || 'Cours sans titre';
      const cleanTitle = cleanCourseTitle(summary);
      const location = event.location || 'Salle non spécifiée';
      const description = event.description || '';
      
      const startDate = event.startDate ? event.startDate.toJSDate() : new Date();
      const endDate = event.endDate ? event.endDate.toJSDate() : new Date();
      
      const teacher = extractTeacher(description);
      const zoomUrl = extractZoomUrl(description, location);

      const matchedFolder = matchDesktopFolder(summary);
      const folderUrl = matchedFolder 
        ? `file://${DESKTOP_ROOT_PATH}/${encodeURIComponent(matchedFolder)}`
        : `file://${DESKTOP_ROOT_PATH}`;

      return {
        id: `ics-event-${index}-${startDate.getTime()}`,
        title: summary,
        cleanTitle: cleanTitle,
        room: location,
        teacher: teacher,
        start: startDate,
        end: endDate,
        rawDescription: description,
        zoomUrl: zoomUrl,
        matchedFolder: matchedFolder,
        folderUrl: folderUrl,
      };
    });

    return courses.sort((a, b) => a.start.getTime() - b.start.getTime());
  } catch (err) {
    console.error('Erreur de parsing ICAL.js:', err);
    return getLocalExtractedCourses();
  }
}
