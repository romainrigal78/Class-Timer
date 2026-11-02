import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { exec, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Executes AppleScript safely using stdin to avoid quoting issues
 */
function runAppleScript(script: string, timeoutMs: number = 2000): Promise<string> {
  return new Promise((resolve) => {
    try {
      const child = spawn('osascript', ['-']);
      let stdout = '';
      let isDone = false;

      const timer = setTimeout(() => {
        if (!isDone) {
          isDone = true;
          try { child.kill(); } catch {}
          resolve('');
        }
      }, timeoutMs);

      child.stdout.on('data', (d) => { stdout += d; });
      child.on('close', () => {
        if (!isDone) {
          isDone = true;
          clearTimeout(timer);
          resolve(stdout.trim());
        }
      });
      child.on('error', () => {
        if (!isDone) {
          isDone = true;
          clearTimeout(timer);
          resolve('');
        }
      });
      child.stdin.write(script);
      child.stdin.end();
    } catch {
      resolve('');
    }
  });
}

/**
 * Extracts active Now Playing multimedia information from macOS (Apple Music & YouTube in browsers)
 */
async function getMacNowPlaying() {
  // 1. Check Apple Music
  const musicScript = `
tell application "System Events" to set isRunning to (name of processes) contains "Music"
if isRunning then
    tell application "Music"
        try
            set pState to player state as string
            set tName to (name of current track as string)
            set tArtist to (artist of current track as string)
            set tAlbum to (album of current track as string)
            set tDuration to (duration of current track as integer)
            set pPosition to (player position as integer)
            return "music|" & pState & "|" & tName & "|" & tArtist & "|" & tAlbum & "|" & tDuration & "|" & pPosition
        on error
            return "none"
        end try
    end tell
end if
return "none"
`;
  const musicRes = await runAppleScript(musicScript);
  let musicData: any = null;
  if (musicRes.startsWith('music|')) {
    const parts = musicRes.split('|');
    const isPlaying = parts[1] === 'playing';
    const trackName = parts[2] || 'Titre inconnu';
    
    // Extract album artwork to /tmp/nowplaying_art.jpg in background
    if (trackName) {
      const artScript = `
try
    tell application "Music"
        set srcData to raw data of artwork 1 of current track
    end tell
    set filePath to (POSIX file "/tmp/nowplaying_art.jpg")
    set fileRef to (open for access filePath with write permission)
    set eof fileRef to 0
    write srcData to fileRef
    close access fileRef
on error
end try
      `;
      runAppleScript(artScript).catch(() => {});
    }

    musicData = {
      source: 'Apple Music',
      isPlaying: isPlaying,
      playerState: parts[1], // 'playing' | 'paused'
      title: trackName,
      artist: parts[3] || 'Apple Music',
      album: parts[4] || '',
      duration: parseInt(parts[5], 10) || 0,
      position: parseInt(parts[6], 10) || 0,
      canControl: true,
      thumbnail: `/api/now-playing/artwork?t=${encodeURIComponent(trackName)}`,
    };
  }

  // 2. Check YouTube in browsers (Safari, Google Chrome, Arc, Brave)
  const ytScript = `
tell application "System Events"
    set procNames to name of processes
end tell

if procNames contains "Safari" then
    tell application "Safari"
        try
            repeat with w in windows
                repeat with t in tabs of w
                    set u to (URL of t as string)
                    if u contains "youtube.com/watch" or u contains "music.youtube.com/watch" then
                        set tTitle to name of t
                        return "youtube|Safari|" & tTitle & "|" & u
                    end if
                end repeat
            end repeat
        end try
    end tell
end if

if procNames contains "Google Chrome" then
    tell application "Google Chrome"
        try
            repeat with w in windows
                repeat with t in tabs of w
                    set u to (URL of t as string)
                    if u contains "youtube.com/watch" or u contains "music.youtube.com/watch" then
                        set tTitle to title of t
                        return "youtube|Chrome|" & tTitle & "|" & u
                    end if
                end repeat
            end repeat
        end try
    end tell
end if

if procNames contains "Arc" then
    tell application "Arc"
        try
            repeat with w in windows
                repeat with t in tabs of w
                    set u to (URL of t as string)
                    if u contains "youtube.com/watch" or u contains "music.youtube.com/watch" then
                        set tTitle to title of t
                        return "youtube|Arc|" & tTitle & "|" & u
                    end if
                end repeat
            end repeat
        end try
    end tell
end if

if procNames contains "Brave Browser" then
    tell application "Brave Browser"
        try
            repeat with w in windows
                repeat with t in tabs of w
                    set u to (URL of t as string)
                    if u contains "youtube.com/watch" or u contains "music.youtube.com/watch" then
                        set tTitle to title of t
                        return "youtube|Brave|" & tTitle & "|" & u
                    end if
                end repeat
            end repeat
        end try
    end tell
end if

return "none"
`;
  const ytRes = await runAppleScript(ytScript);
  let ytData: any = null;
  if (ytRes.startsWith('youtube|')) {
    const parts = ytRes.split('|');
    const browser = parts[1] || 'Navigateur';
    const rawTitle = parts[2] || 'YouTube';
    const cleanTitle = rawTitle.replace(/ - YouTube( Music)?$/i, '').trim();
    const url = parts[3] || '';
    let videoId = '';
    try {
      const parsedUrl = new URL(url);
      videoId = parsedUrl.searchParams.get('v') || '';
    } catch {}

    ytData = {
      source: url.includes('music.youtube.com') ? 'YouTube Music' : 'YouTube',
      browser: browser,
      isPlaying: true,
      playerState: 'playing',
      title: cleanTitle,
      artist: `En lecture sur ${browser}`,
      album: 'YouTube Video',
      duration: 0,
      position: 0,
      canControl: false,
      url: url,
      thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '',
    };
  }

  // Priority Decision:
  // 1. If Apple Music is actively playing, show Apple Music
  if (musicData && musicData.isPlaying) {
    return { active: true, ...musicData };
  }
  // 2. If YouTube is open/playing, show YouTube
  if (ytData) {
    return { active: true, ...ytData };
  }
  // 3. If Apple Music has a loaded track (even paused), show Apple Music
  if (musicData && musicData.title) {
    return { active: true, ...musicData };
  }

  return { active: false };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'open-folder-and-media-api',
      configureServer(server) {
        // macOS Now Playing Media API (Apple Music & YouTube)
        server.middlewares.use('/api/now-playing/artwork', (_req, res) => {
          const artPath = '/tmp/nowplaying_art.jpg';
          if (fs.existsSync(artPath)) {
            try {
              const stat = fs.statSync(artPath);
              res.writeHead(200, {
                'Content-Type': 'image/jpeg',
                'Content-Length': stat.size,
                'Cache-Control': 'no-cache',
              });
              fs.createReadStream(artPath).pipe(res);
              return;
            } catch {}
          }
          res.statusCode = 404;
          res.end('No artwork');
        });

        server.middlewares.use('/api/now-playing', async (req, res, next) => {
          if (req.url && req.url.startsWith('/artwork')) {
            return next();
          }
          if (req.method === 'GET') {
            try {
              const data = await getMacNowPlaying();
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Cache-Control', 'no-cache');
              return res.end(JSON.stringify(data));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ active: false, error: err.message }));
            }
          }
          next();
        });

        // macOS Media Controls API (Play/Pause, Next, Previous for Apple Music)
        server.middlewares.use('/api/media-control', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (c) => { body += c; });
            req.on('end', async () => {
              try {
                const { action } = JSON.parse(body);
                if (action === 'playpause') {
                  await runAppleScript('tell application "Music" to playpause');
                } else if (action === 'play') {
                  await runAppleScript('tell application "Music" to play');
                } else if (action === 'pause') {
                  await runAppleScript('tell application "Music" to pause');
                } else if (action === 'next') {
                  await runAppleScript('tell application "Music" to next track');
                } else if (action === 'previous') {
                  await runAppleScript('tell application "Music" to previous track');
                }
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: true, action }));
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
          res.statusCode = 405;
          res.end('Method Not Allowed');
        });

        // Finder Open Folder Route
        server.middlewares.use('/api/open-folder', (req, res) => {
          const url = new URL(req.url || '', 'http://localhost:5173');
          const folder = url.searchParams.get('folder') || '';
          
          const desktopPath = folder.trim().length > 0
            ? `/Users/romainrigal/Desktop/${folder.trim()}`
            : `/Users/romainrigal/Desktop`;
          
          const documentsPath = folder.trim().length > 0
            ? `/Users/romainrigal/Documents/EMLV/A2 - Semestre 1/${folder.trim()}`
            : `/Users/romainrigal/Documents/EMLV/A2 - Semestre 1`;

          const targetPath = fs.existsSync(desktopPath) 
            ? desktopPath 
            : (fs.existsSync(documentsPath) ? documentsPath : desktopPath);

          exec(`open "${targetPath}"`, (err) => {
            if (err) {
              exec(`open "/Users/romainrigal/Desktop"`);
            }
          });

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, folder, path: targetPath }));
        });

        // Quizzes JSON datatable persistence Route
        server.middlewares.use('/api/quizzes', (req, res) => {
          const quizzesFilePath = path.resolve(process.cwd(), 'src/data/quizzes.json');

          if (req.method === 'GET') {
            try {
              if (fs.existsSync(quizzesFilePath)) {
                const data = fs.readFileSync(quizzesFilePath, 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                return res.end(data);
              }
            } catch (err) {
              console.error('Error reading quizzes.json:', err);
            }
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify([]));
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                fs.writeFileSync(quizzesFilePath, JSON.stringify(parsed, null, 2), 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: true, count: parsed.length }));
              } catch (err: any) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }

          res.statusCode = 405;
          res.end('Method Not Allowed');
        });

        // ==========================================
        // DEBUG: JSON Files Management Endpoints
        // ==========================================
        const DEBUG_JSON_FILES: Record<string, { name: string; relativePath: string; description: string }> = {
          'quizzes': {
            name: 'quizzes.json',
            relativePath: 'src/data/quizzes.json',
            description: 'Agenda des Quizz & Évaluations',
          },
          'game': {
            name: 'gameProfOrAccountant.json',
            relativePath: 'src/data/gameProfOrAccountant.json',
            description: 'Jeu Prof De Vinci vs Comptable LinkedIn (198 profils)',
          },
          'courses_data': {
            name: '_courses_data.json',
            relativePath: 'src/data/_courses_data.json',
            description: 'Données brutes des cours & professeurs 2026/2027',
          },
          'courses': {
            name: 'courses.json',
            relativePath: 'src/data/courses.json',
            description: 'Emploi du temps extrait',
          },
          'package': {
            name: 'package.json',
            relativePath: 'package.json',
            description: 'Configuration du projet & scripts npm',
          },
        };

        // List JSON files
        server.middlewares.use('/api/debug/json/list', (_req, res) => {
          const list = Object.entries(DEBUG_JSON_FILES).map(([id, meta]) => {
            const fullPath = path.resolve(process.cwd(), meta.relativePath);
            const exists = fs.existsSync(fullPath);
            let size = 0;
            let updatedAt = '';
            if (exists) {
              const stat = fs.statSync(fullPath);
              size = stat.size;
              updatedAt = stat.mtime.toISOString();
            }
            return {
              id,
              name: meta.name,
              path: meta.relativePath,
              description: meta.description,
              exists,
              size,
              updatedAt,
            };
          });
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(list));
        });

        // Read JSON file
        server.middlewares.use('/api/debug/json/read', (req, res) => {
          const url = new URL(req.url || '', 'http://localhost:5173');
          const fileKey = url.searchParams.get('file') || 'quizzes';
          const fileMeta = DEBUG_JSON_FILES[fileKey] || Object.values(DEBUG_JSON_FILES).find(f => f.name === fileKey);

          if (!fileMeta) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Fichier non trouvé ou non autorisé.' }));
          }

          const fullPath = path.resolve(process.cwd(), fileMeta.relativePath);
          if (!fs.existsSync(fullPath)) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Fichier introuvable sur le disque.' }));
          }

          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const stat = fs.statSync(fullPath);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              fileKey,
              name: fileMeta.name,
              path: fileMeta.relativePath,
              content,
              size: stat.size,
              updatedAt: stat.mtime.toISOString(),
            }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });

        // Write JSON file
        server.middlewares.use('/api/debug/json/write', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (c) => { body += c; });
            req.on('end', () => {
              try {
                const { fileKey, content } = JSON.parse(body);
                const fileMeta = DEBUG_JSON_FILES[fileKey] || Object.values(DEBUG_JSON_FILES).find(f => f.name === fileKey);

                if (!fileMeta) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ error: 'Fichier non autorisé.' }));
                }

                // Parse check
                let parsed: any;
                try {
                  parsed = JSON.parse(content);
                } catch (jsonErr: any) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ error: `Format JSON invalide : ${jsonErr.message}` }));
                }

                const fullPath = path.resolve(process.cwd(), fileMeta.relativePath);
                fs.writeFileSync(fullPath, JSON.stringify(parsed, null, 2), 'utf-8');
                const stat = fs.statSync(fullPath);

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: true,
                  message: `Fichier ${fileMeta.name} sauvegardé avec succès !`,
                  size: stat.size,
                  updatedAt: stat.mtime.toISOString(),
                }));
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
          res.statusCode = 405;
          res.end('Method Not Allowed');
        });

        // ==========================================
        // DEBUG: Interactive Terminal Execution Route
        // ==========================================
        server.middlewares.use('/api/debug/terminal/exec', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (c) => { body += c; });
            req.on('end', () => {
              try {
                const { command } = JSON.parse(body);
                if (!command || typeof command !== 'string') {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ error: 'Commande manquante' }));
                }

                const trimmed = command.trim();
                if (trimmed === 'clear') {
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ stdout: '', stderr: '', exitCode: 0, isClear: true }));
                }

                exec(trimmed, {
                  cwd: process.cwd(),
                  timeout: 25000,
                  maxBuffer: 4 * 1024 * 1024,
                  shell: '/bin/zsh',
                }, (error, stdout, stderr) => {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    stdout: stdout || '',
                    stderr: stderr || (error ? error.message : ''),
                    exitCode: error ? (error.code ?? 1) : 0,
                    cwd: process.cwd(),
                  }));
                });
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
          res.statusCode = 405;
          res.end('Method Not Allowed');
        });

        // Webhook Login Attempt Route
        server.middlewares.use('/api/log-login', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const logData = JSON.parse(body);
                console.log(`\n🔔 [KeyAuth Webhook] Attempt: ${logData.username} (${logData.status}) | IP: ${logData.ipAddress} | OS: ${logData.os} | Browser: ${logData.browser}`);
              } catch {
                // Ignore parse errors
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ received: true }));
            });
          } else {
            res.end(JSON.stringify({ status: 'ok' }));
          }
        });
      },
    },
  ],
});
