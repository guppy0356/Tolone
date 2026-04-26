const COOKIE_KEY = "novelAuth";
const subscribers = new Set<() => void>();

export function getAuthCookie(): string | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_KEY}=`));
  if (!match) return null;
  const value = match.slice(COOKIE_KEY.length + 1);
  return value === "" ? null : value;
}

export function isAuthenticated(): boolean {
  return getAuthCookie() !== null;
}

export function setAuthCookie(token: string): void {
  document.cookie = `${COOKIE_KEY}=${token}; path=/; SameSite=Lax`;
  subscribers.forEach((fn) => fn());
}

export function clearAuthCookie(): void {
  document.cookie = `${COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
  subscribers.forEach((fn) => fn());
}

export function subscribeAuth(fn: () => void): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}
