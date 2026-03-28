import type { FamilyMember } from "../features/family-todo/FamilyTodo.api";

const COOKIE_KEY = "currentUser";

export function getCurrentUserFromCookie(): FamilyMember | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_KEY}=`));
  return match ? (match.split("=")[1] as FamilyMember) : null;
}

export function setCurrentUserCookie(member: FamilyMember): void {
  document.cookie = `${COOKIE_KEY}=${member}; path=/; SameSite=Lax`;
}
