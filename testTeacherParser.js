import ICAL from 'ical.js';

const icsUrl = "https://outlook.office365.com/owa/calendar/7f1f6a14e5da4edbbe237c52d2513ce3@edu.devinci.fr/16dc32fcbb95471193d28303e8bbd8bf3060439431801066347/calendar.ics";

function parseSummaryAndTeacher(summary, description) {
  if (!summary) return { courseName: "Cours sans titre", teacherName: "Enseignant non spécifié" };

  let courseName = summary;
  let teacherName = "";

  // 1. Try extracting teacher from description first
  if (description) {
    const descMatch = description.match(/(?:Enseignant|Professeur|Intervenant)\s*:\s*([^\n\r]+)/i);
    if (descMatch && descMatch[1]?.trim()) {
      teacherName = descMatch[1].trim();
    }
  }

  // 2. Try extracting teacher from summary tag: e.g. [CA]PRESCOTT Jason or [CMo]TÜRKER ÖZMEN Duygu
  if (!teacherName) {
    const summaryTeacherMatch = summary.match(/\[(?:CA|CMo|LV|LVo|TD|SP|NR|CAo)\]\s*([A-ZÀ-ÿ\s'-]+)$/i);
    if (summaryTeacherMatch && summaryTeacherMatch[1]?.trim()) {
      teacherName = summaryTeacherMatch[1].trim();
    }
  }

  // If still no teacher, look for trailing name after last bracket
  if (!teacherName) {
    const trailingNameMatch = summary.match(/\]\s*([A-ZÀ-ÿ\s'-]{3,})$/);
    if (trailingNameMatch && trailingNameMatch[1]?.trim()) {
      teacherName = trailingNameMatch[1].trim();
    }
  }

  // Clean courseName by removing brackets [MEMLDF23E526], [CA], [CMo], [Examen], etc.
  courseName = courseName
    .replace(/\[[A-Za-z0-9_ -]+\]/g, " ")
    .replace(/(Enseignant|Professeur)\s*:\s*[^\n\r]+/gi, " ");

  if (teacherName) {
    // Remove teacherName from courseName if it appears there
    const teacherRegex = new RegExp(teacherName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    courseName = courseName.replace(teacherRegex, " ");
  }

  courseName = courseName.replace(/\s+/g, " ").trim();

  if (!teacherName) teacherName = "Enseignant non spécifié";

  return { courseName, teacherName };
}

fetch(icsUrl)
  .then(res => res.text())
  .then(icsData => {
    const jcalData = ICAL.parse(icsData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");

    const filterDate = new Date("2026-09-01T00:00:00Z");

    const samples = [];
    vevents.forEach(v => {
      const ev = new ICAL.Event(v);
      const start = ev.startDate ? ev.startDate.toJSDate() : null;
      if (!start || start < filterDate) return;
      if (/pôle-e|pole-e/i.test(ev.location || "")) return;

      const { courseName, teacherName } = parseSummaryAndTeacher(ev.summary, ev.description);
      samples.push({ raw: ev.summary, courseName, teacherName, room: ev.location });
    });

    console.log(`Parsed ${samples.length} courses!\n`);
    console.log("Sample extracted courses & teachers:");
    samples.slice(0, 25).forEach(s => {
      console.log(`RAW: "${s.raw}"`);
      console.log(` ➡️ COURSE: "${s.courseName}"`);
      console.log(` ➡️ PROF:   "${s.teacherName}"`);
      console.log("-".repeat(60));
    });
  });
