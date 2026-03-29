import { getApiBaseUrl } from '../utils/apiBaseUrl';
import { User, UserRole } from '../types/index';

const API_URL = getApiBaseUrl();

type DemoLoginResponse = {
  access_token: string;
  user: User;
};

interface DemoCredential {
  email: string;
  password: string;
}

const DEMO_CREDENTIALS: Record<UserRole, DemoCredential[]> = {
  admin: [
    { email: 'admin@hostel.com', password: 'admin123' },
    { email: 'admin2@hostel.com', password: 'admin123' },
    { email: 'admin@hostel.com', password: '555555' },
  ],
  student: [
    { email: 'student.demo@hostel.com', password: 'demo123' },
    { email: 'student1@hostel.com', password: 'student123' },
    { email: 'student2@hostel.com', password: 'student123' },
  ],
};

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Admin',
  student: 'Student',
};

async function tryCredential(credential: DemoCredential): Promise<DemoLoginResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credential),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(String(data.error || 'Login failed'));
  }

  return res.json();
}

async function tryBackendDemoLogin(role: UserRole): Promise<DemoLoginResponse> {
  const res = await fetch(`${API_URL}/auth/demo/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(String(data.error || data.detail || 'Demo login failed'));
  }

  return res.json();
}

export const demoAccountsService = {
  async loginByRole(role: UserRole): Promise<DemoLoginResponse> {
    // Preferred path: backend-managed role-safe demo login.
    try {
      return await tryBackendDemoLogin(role);
    } catch {
      // Fall back to credential attempts for backward compatibility.
    }

    const candidates = DEMO_CREDENTIALS[role] || [];

    for (const credential of candidates) {
      try {
        const data = await tryCredential(credential);
        if (data.user?.role === role) {
          return data;
        }
      } catch {
        // Try next demo credential candidate.
      }
    }

    throw new Error(
      `${ROLE_LABEL[role]} demo account is unavailable right now. Please run backend demo seed/init and retry.`
    );
  },
};
