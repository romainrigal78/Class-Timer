import ICAL from 'ical.js';
import fs from 'fs';
import path from 'path';

const icsUrl = "https://outlook.office365.com/owa/calendar/7f1f6a14e5da4edbbe237c52d2513ce3@edu.devinci.fr/16dc32fcbb95471193d28303e8bbd8bf3060439431801066347/calendar.ics";

const desktopPath = "/Users/romainrigal/Desktop";
const desktopFolders = fs.readdirSync(desktopPath).filter(f => fs.statSync(path.join(desktopPath, f)).isDirectory() && !f.startsWith("."));

const enrichedRules = [
  { keywords: ["taxation", "fiscalite", "fiscalité", "tax"], folder: "Taxation" },
  { keywords: ["excel", "collab tools"], folder: "Advanced Excel" },
  { keywords: ["negotiation", "negociation", "négociation"], folder: "Basics of negotiation" },
  { keywords: ["business law", "labour law", "droit", "law", "legal"], folder: "Business Law" },
  { keywords: ["coopération", "cooperation", "equipe", "équipe", "intelligence collective", "efficacité indiv", "efficacite indiv"], folder: "Cooperation en equipe" },
  { keywords: ["espagnol", "spanish"], folder: "Espagnol" },
  { keywords: ["ethics", "csr", "rse", "ethique", "éthique", "sustainable", "climate", "transitions", "geopolitics"], folder: "Ethics and CSR" },
  { keywords: ["etudes de marche", "études de marché", "market studies", "vente", "démarche commerciale"], folder: "Etudes de Marche" },
  { keywords: ["management control", "management", "control", "control du management"], folder: "Management control" },
  { keywords: ["accounting", "financial accounting", "financial accounting 2", "comptabilité financière", "compta"], folder: "Financial accounting 2" },
  { keywords: ["mathematics", "math", "maths", "stock exchange", "finance", "micro-economics", "micro-économie"], folder: "Financial mathematics" },
  { keywords: ["information systems", "fundamentals management", "fundamentals marketing", "systemes d information", "coding", "fablab", "ai & work", "ia & work", "design thinking", "initiation to ai", "initiation to coding"], folder: "Fundament Information Systems" },
  { keywords: ["marketing strategy", "marketing", "selling", "produits innovants", "innovating products"], folder: "Marketing Strategy" },
  { keywords: ["hackathon", "internship y1", "stage a1", "a1"], folder: "A1 - Semestre 1" },
  { keywords: ["semestre 2", "stage a2", "a2"], folder: "A2 - Semestre 2" }
];

function cleanCourseTitle(rawSummary) {
  if (!rawSummary) return "Cours sans titre";
  return rawSummary
    .replace(/\[[A-Za-z0-9_ -]+\]/g, " ")
    .replace(/(Enseignant|Professeur)\s*:\s*[^\n\r]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchDesktopFolder(rawSummary) {
  if (!rawSummary) return null;
  const t = rawSummary.toLowerCase();
  for (const rule of enrichedRules) {
    if (rule.keywords.some(k => t.includes(k))) {
      return rule.folder;
    }
  }

  const cleanTitle = cleanCourseTitle(rawSummary);
  const normalize = (str) => 
    str.toLowerCase()
       .normalize("NFD")
       .replace(/[\u0300-\u036f]/g, "")
       .replace(/[^a-z0-9\s]/g, " ");

  const titleTokens = normalize(cleanTitle).split(/\s+/).filter(x => x.length > 2);

  for (const folder of desktopFolders) {
    const folderLower = normalize(folder);
    if (titleTokens.some(tok => folderLower.includes(tok) || tok.includes(folderLower))) {
      return folder;
    }
  }

  return null;
}

function extractTeacher(description) {
  if (!description) return "Enseignant non spécifié";
  const primaryRegex = /(?:Enseignant|Professeur)\s*:\s*([^\n\r]+)/i;
  const match = description.match(primaryRegex);
  if (match && match[1]?.trim()) return match[1].trim();
  const fallbackRegex = /(?:Intervenant|Enseignants?|Prof)\s*:\s*([^\n\r]+)/i;
  const fallbackMatch = description.match(fallbackRegex);
  if (fallbackMatch && fallbackMatch[1]?.trim()) return fallbackMatch[1].trim();
  return "Enseignant non spécifié";
}

function extractZoomUrl(description, location) {
  const combined = `${description || ""} ${location || ""}`;
  const zoomRegex = /(https:\/\/[a-zA-Z0-9-]+\.zoom\.us\/j\/[^\s\n\r"'>]+)/i;
  const match = combined.match(zoomRegex);
  return match ? match[1] : null;
}

fetch(icsUrl)
  .then(res => res.text())
  .then(icsData => {
    const jcalData = ICAL.parse(icsData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");

    // Strictly start from September 1st 2026 for CURRENT academic year
    const filterDate = new Date("2026-09-01T00:00:00Z");

    const courses = [];
    let excludedPoleECount = 0;

    vevents.forEach((vevent, index) => {
      const event = new ICAL.Event(vevent);
      const startDate = event.startDate ? event.startDate.toJSDate() : null;
      const endDate = event.endDate ? event.endDate.toJSDate() : null;

      // Filter 1: Must start Sept 2026 onwards
      if (!startDate || startDate < filterDate) return;

      const location = event.location || "Salle non spécifiée";

      // Filter 2: Exclude pole-E / pôle-e
      if (/pôle-e|pole-e/i.test(location)) {
        excludedPoleECount++;
        return;
      }

      const summary = event.summary || "Cours sans titre";
      const cleanTitle = cleanCourseTitle(summary);
      const description = event.description || "";
      const teacher = extractTeacher(description);
      const zoomUrl = extractZoomUrl(description, location);
      const matchedFolder = matchDesktopFolder(summary);

      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, '0');
      const day = String(startDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const startTimeStr = startDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
      const endTimeStr = endDate ? endDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }) : "";

      courses.push({
        id: `course-${index}-${startDate.getTime()}`,
        nom: cleanTitle,
        titreBrut: summary,
        date: dateStr,
        heureDebut: startTimeStr,
        heureFin: endTimeStr,
        horaires: `${startTimeStr} - ${endTimeStr}`,
        prof: teacher,
        salle: location,
        zoomUrl: zoomUrl,
        dossierDesktop: matchedFolder,
        cheminDossier: matchedFolder ? `file:///Users/romainrigal/Desktop/${encodeURIComponent(matchedFolder)}` : null,
        debutIso: startDate.toISOString(),
        finIso: endDate ? endDate.toISOString() : startDate.toISOString()
      });
    });

    courses.sort((a, b) => new Date(a.debutIso).getTime() - new Date(b.debutIso).getTime());

    console.log(`✅ Extracted ${courses.length} courses for Sept 2026 - 2027! (Excluded ${excludedPoleECount} pole-E events)`);

    const targetJsonPath = "/Users/romainrigal/.gemini/antigravity/scratch/university-dashboard/src/data/courses.json";
    fs.mkdirSync(path.dirname(targetJsonPath), { recursive: true });
    fs.writeFileSync(targetJsonPath, JSON.stringify(courses, null, 2), "utf-8");

    const rootJsonPath = "/Users/romainrigal/.gemini/antigravity/scratch/university-dashboard/courses.json";
    fs.writeFileSync(rootJsonPath, JSON.stringify(courses, null, 2), "utf-8");

    console.log(`Updated 2026-2027 academic year JSON files at:\n 1. ${targetJsonPath}\n 2. ${rootJsonPath}`);
  })
  .catch(err => console.error("Error generating courses JSON:", err));
