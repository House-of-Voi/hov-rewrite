import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'hov_sess';

export async function setSessionCookie(token: string, maxAgeSeconds: number) {
  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' });
}
