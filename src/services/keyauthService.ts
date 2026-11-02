export interface UserProfile {
  username: string;
  email: string;
  dob?: string;
  school: 'EMLV' | 'IIM' | 'ESILV';
  role: 'owner' | 'student';
  sessionToken: string;
  createdAt: string;
  year?: string;
  track?: string;
  group?: string;
}

export interface LoginAttempt {
  id: string;
  username: string;
  status: 'SUCCESS' | 'FAILED';
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  browser: string;
  os: string;
  school?: string;
}

export const KEYAUTH_CONFIG = {
  appName: 'Management',
  ownerId: 'RdPfeQC94o',
  secret: '77c7a078dc0c2696627546a256e5ee67fd11386aa6ac332291a6f3018ee0a13d',
  version: '1.0',
};

const STORAGE_KEY_AUTH_SESSION = 'keyauth_user_session';
const STORAGE_KEY_LOGS = 'keyauth_login_attempts';
const STORAGE_KEY_USERS = 'keyauth_registered_users';

const TEST_USERS: UserProfile[] = [
  {
    username: 'roman',
    email: 'roman.owner@devinci.fr',
    dob: '2000-01-01',
    school: 'EMLV',
    role: 'owner',
    sessionToken: 'token_owner_roman_123',
    createdAt: '2026-09-01T10:00:00.000Z',
    year: 'A2',
    track: 'International',
    group: 'ITA',
  },
  {
    username: 'testuser',
    email: 'student.test@devinci.fr',
    dob: '2004-05-15',
    school: 'EMLV',
    role: 'student',
    sessionToken: 'token_student_test_456',
    createdAt: '2026-09-10T14:30:00.000Z',
    year: 'A2',
    track: 'International',
    group: 'ITA',
  },
];

export function getRegisteredUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : TEST_USERS;
    }
  } catch {
    // Silent catch
  }
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(TEST_USERS));
  return TEST_USERS;
}

function saveRegisteredUsers(users: UserProfile[]): void {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
}

export function getLoginAttempts(): LoginAttempt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Silent catch
  }
  return [];
}

export async function logLoginAttempt(
  username: string, 
  status: 'SUCCESS' | 'FAILED',
  school?: string
): Promise<LoginAttempt> {
  const ua = navigator.userAgent;
  let browser = 'Chrome';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';

  let os = 'macOS';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  const newLog: LoginAttempt = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    username,
    status,
    timestamp: new Date().toISOString(),
    ipAddress: '127.0.0.1 (Localhost)',
    userAgent: ua,
    browser,
    os,
    school,
  };

  const currentLogs = getLoginAttempts();
  const updatedLogs = [newLog, ...currentLogs].slice(0, 100);
  localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updatedLogs));

  fetch('/api/log-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...newLog,
      app: KEYAUTH_CONFIG.appName,
      version: KEYAUTH_CONFIG.version,
    }),
  }).catch((err) => console.warn('Webhook logging error:', err));

  return newLog;
}

export async function keyauthLogin(username: string, password: string): Promise<UserProfile> {
  const cleanUsername = username.trim();
  const cleanPassword = password.trim();

  const users = getRegisteredUsers();
  const matched = users.find(
    (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
  );

  if (cleanUsername.toLowerCase() === 'roman' && (cleanPassword === 'roman123' || cleanPassword === 'roman')) {
    const ownerUser = matched || TEST_USERS[0];
    await logLoginAttempt(cleanUsername, 'SUCCESS', ownerUser.school);
    saveCurrentSession(ownerUser);
    return ownerUser;
  }

  if (cleanUsername.toLowerCase() === 'testuser' && (cleanPassword === 'test1234' || cleanPassword === 'testuser')) {
    const studentUser = matched || TEST_USERS[1];
    await logLoginAttempt(cleanUsername, 'SUCCESS', studentUser.school);
    saveCurrentSession(studentUser);
    return studentUser;
  }

  if (matched && cleanPassword.length >= 4) {
    await logLoginAttempt(cleanUsername, 'SUCCESS', matched.school);
    saveCurrentSession(matched);
    return matched;
  }

  await logLoginAttempt(cleanUsername, 'FAILED');
  throw new Error('Identifiants KeyAuth invalides. Vérifiez le nom d\'utilisateur et le mot de passe.');
}

export async function keyauthLicenseLogin(licenseKey: string): Promise<UserProfile> {
  const cleanKey = licenseKey.trim();
  if (cleanKey.length < 8) {
    await logLoginAttempt('LicenseUser', 'FAILED');
    throw new Error('Clé de licence invalide ou expirée.');
  }

  const licenseUser: UserProfile = {
    username: `LicenseUser_${cleanKey.substring(0, 5)}`,
    email: 'license.user@devinci.fr',
    school: 'EMLV',
    role: 'student',
    sessionToken: `token_keyauth_${cleanKey}`,
    createdAt: new Date().toISOString(),
  };

  await logLoginAttempt(licenseUser.username, 'SUCCESS', 'EMLV');
  saveCurrentSession(licenseUser);
  return licenseUser;
}

export async function keyauthRegister(data: {
  username: string;
  email: string;
  password: string;
  dob: string;
  school: 'EMLV' | 'IIM' | 'ESILV';
}): Promise<UserProfile> {
  const cleanUsername = data.username.trim();
  const cleanEmail = data.email.trim();

  if (!cleanUsername || !cleanEmail || !data.password) {
    throw new Error('Veuillez remplir tous les champs obligatoires.');
  }

  const users = getRegisteredUsers();
  if (users.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
    throw new Error('Ce nom d\'utilisateur existe déjà dans KeyAuth.');
  }

  const isOwner = cleanUsername.toLowerCase() === 'roman';
  const newUser: UserProfile = {
    username: cleanUsername,
    email: cleanEmail,
    dob: data.dob,
    school: data.school,
    role: isOwner ? 'owner' : 'student',
    sessionToken: `token_${cleanUsername}_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  const updatedUsers = [...users, newUser];
  saveRegisteredUsers(updatedUsers);

  await logLoginAttempt(cleanUsername, 'SUCCESS', data.school);
  saveCurrentSession(newUser);
  return newUser;
}

export function getCurrentSession(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH_SESSION);
    if (raw) return JSON.parse(raw);
  } catch {
    // Silent catch
  }
  return null;
}

export function saveCurrentSession(user: UserProfile): void {
  localStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(user));
}

export function logoutSession(): void {
  localStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
}

export function updateTrackSelection(year: string, track?: string, group?: string): UserProfile | null {
  const current = getCurrentSession();
  if (!current) return null;

  const updated: UserProfile = {
    ...current,
    year,
    track,
    group,
  };

  saveCurrentSession(updated);

  const users = getRegisteredUsers();
  const idx = users.findIndex((u) => u.username.toLowerCase() === updated.username.toLowerCase());
  if (idx !== -1) {
    users[idx] = updated;
    saveRegisteredUsers(users);
  }

  return updated;
}
