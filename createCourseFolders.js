import ICAL from 'ical.js';
import fs from 'fs';
import path from 'path';

const icsUrl = "https://outlook.office365.com/owa/calendar/7f1f6a14e5da4edbbe237c52d2513ce3@edu.devinci.fr/16dc32fcbb95471193d28303e8bbd8bf3060439431801066347/calendar.ics";

const desktopPath = "/Users/romainrigal/Desktop";
const existingFolders = fs.readdirSync(desktopPath).filter(f => fs.statSync(path.join(desktopPath, f)).isDirectory() && !f.startsWith("."));

const enrichedRules = [
  { keywords: ["management control", "contrôle de gestion", "controle de gestion"], folder: "Management control" },
  { keywords: ["taxation", "fiscalite", "fiscalité", "tax"], folder: "Taxation" },
  { keywords: ["excel", "collab tools"], folder: "Advanced Excel" },
  { keywords: ["negotiation", "negociation", "négociation"], folder: "Basics of negotiation" },
  { keywords: ["business law", "labour law", "droit", "law", "legal"], folder: "Business Law" },
  { keywords: ["coopération", "cooperation", "equipe", "équipe", "intelligence collective", "efficacité indiv"], folder: "Cooperation en equipe" },
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

function cleanCourseTitle(rawSummary) {
  if (!rawSummary) return "Cours sans titre";
  return rawSummary
    .replace(/\[[A-Za-z0-9_ -]+\]/g, " ")
    .replace(/(Enseignant|Professeur)\s*:\s*[^\n\r]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSummaryAndTeacher(summary, description) {
  if (!summary) return { courseName: "Cours sans titre", teacherName: "Enseignant non spécifié" };

  let courseName = summary;
  let teacherName = "";

  if (description) {
    const descMatch = description.match(/(?:Enseignant|Professeur|Intervenant)\s*:\s*([^\n\r]+)/i);
    if (descMatch && descMatch[1]?.trim()) {
      teacherName = descMatch[1].trim();
    }
  }

  if (!teacherName) {
    const summaryTeacherMatch = summary.match(/\[(?:CA|CMo|LV|LVo|TD|SP|NR|CAo)\]\s*([A-ZÀ-ÿ\s'-]+)$/i);
    if (summaryTeacherMatch && summaryTeacherMatch[1]?.trim()) {
      teacherName = summaryTeacherMatch[1].trim();
    }
  }

  if (!teacherName) {
    const trailingNameMatch = summary.match(/\]\s*([A-ZÀ-ÿ\s'-]{3,})$/);
    if (trailingNameMatch && trailingNameMatch[1]?.trim()) {
      teacherName = trailingNameMatch[1].trim();
    }
  }

  courseName = courseName
    .replace(/\[[A-Za-z0-9_ -]+\]/g, " ")
    .replace(/(Enseignant|Professeur)\s*:\s*[^\n\r]+/gi, " ");

  if (teacherName) {
    const teacherRegex = new RegExp(teacherName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    courseName = courseName.replace(teacherRegex, " ");
  }

  courseName = courseName.replace(/\s+/g, " ").trim();

  if (!teacherName) teacherName = "Enseignant non spécifié";

  return { courseName, teacherName };
}

function matchDesktopFolder(summary, cleanName) {
  const t = summary.toLowerCase();
  for (const rule of enrichedRules) {
    if (rule.keywords.some(k => t.includes(k))) {
      return rule.folder;
    }
  }

  const normalize = (str) => 
    str.toLowerCase()
       .normalize("NFD")
       .replace(/[\u0300-\u036f]/g, "")
       .replace(/[^a-z0-9\s]/g, " ");

  const titleTokens = normalize(cleanName).split(/\s+/).filter(x => x.length > 2);

  for (const folder of existingFolders) {
    const folderLower = normalize(folder);
    if (titleTokens.some(tok => folderLower.includes(tok) || tok.includes(folderLower))) {
      return folder;
    }
  }

  if (cleanName && !cleanName.startsWith("Réservation") && !cleanName.startsWith("Présentation") && !cleanName.startsWith("Journée") && !cleanName.startsWith("VSS")) {
    return cleanName;
  }

  return null;
}

fetch(icsUrl)
  .then(res => res.text())
  .then(icsData => {
    const jcalData = ICAL.parse(icsData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");

    const filterDate = new Date("2026-09-01T00:00:00Z");

    const courses = [];

    vevents.forEach((vevent, index) => {
      const event = new ICAL.Event(vevent);
      const startDate = event.startDate ? event.startDate.toJSDate() : null;
      const endDate = event.endDate ? event.endDate.toJSDate() : null;

      if (!startDate || startDate < filterDate) return;

      const location = event.location || "Salle non spécifiée";
      if (/pôle-e|pole-e/i.test(location)) return;

      const summary = event.summary || "Cours sans titre";
      const description = event.description || "";
      const { courseName, teacherName } = parseSummaryAndTeacher(summary, description);

      const zoomUrl = (description + " " + location).match(/(https:\/\/[a-zA-Z0-9-]+\.zoom\.us\/j\/[^\s\n\r"'>]+)/i)?.[1] || null;

      const folderName = matchDesktopFolder(summary, courseName);

      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, '0');
      const day = String(startDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const startTimeStr = startDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
      const endTimeStr = endDate ? endDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }) : "";

      courses.push({
        id: `course-${index}-${startDate.getTime()}`,
        nom: courseName,
        titreBrut: summary,
        date: dateStr,
        heureDebut: startTimeStr,
        heureFin: endTimeStr,
        horaires: `${startTimeStr} - ${endTimeStr}`,
        prof: teacherName,
        salle: location,
        zoomUrl: zoomUrl,
        dossierDesktop: folderName,
        cheminDossier: folderName ? `file:///Users/romainrigal/Desktop/${encodeURIComponent(folderName)}` : null,
        debutIso: startDate.toISOString(),
        finIso: endDate ? endDate.toISOString() : startDate.toISOString()
      });
    });

    courses.sort((a, b) => new Date(a.debutIso).getTime() - new Date(b.debutIso).getTime());

    const targetJsonPath = "/Users/romainrigal/Desktop/Class Dashboard/src/data/courses.json";
    fs.mkdirSync(path.dirname(targetJsonPath), { recursive: true });
    fs.writeFileSync(targetJsonPath, JSON.stringify(courses, null, 2), "utf-8");

    const rootJsonPath = "/Users/romainrigal/Desktop/Class Dashboard/courses.json";
    fs.writeFileSync(rootJsonPath, JSON.stringify(courses, null, 2), "utf-8");

    // Also sync to scratch folder for parity
    fs.mkdirSync("/Users/romainrigal/.gemini/antigravity/scratch/university-dashboard/src/data", { recursive: true });
    fs.writeFileSync("/Users/romainrigal/.gemini/antigravity/scratch/university-dashboard/src/data/courses.json", JSON.stringify(courses, null, 2), "utf-8");
    fs.writeFileSync("/Users/romainrigal/.gemini/antigravity/scratch/university-dashboard/courses.json", JSON.stringify(courses, null, 2), "utf-8");

    console.log(`✅ Extracted ${courses.length} courses! Management Control mapped strictly to 'Management control'!`);
  })
  .catch(err => console.error("Error:", err));
