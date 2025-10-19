import { mockProfile } from './mockData';

export interface DemoSession {
  profileId: string;
  email: string;
  displayName: string;
  jti: string;
}

let demoSession: DemoSession | null = null;

export function getDemoSession(): DemoSession | null {
  return demoSession;
}

export function setDemoSession(session: DemoSession | null): void {
  demoSession = session;
}

export function createDemoSession(): DemoSession {
  const session: DemoSession = {
    profileId: mockProfile.id,
    email: mockProfile.primary_email,
    displayName: mockProfile.display_name,
    jti: 'demo_jwt_' + Date.now(),
  };
  setDemoSession(session);
  return session;
}

export function clearDemoSession(): void {
  demoSession = null;
}

export function hasDemoSession(): boolean {
  return demoSession !== null;
}
