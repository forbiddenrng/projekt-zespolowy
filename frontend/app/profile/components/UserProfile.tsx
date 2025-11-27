// components/UserProfile.tsx
"use client";

interface SavedProfile {
  name?: string | null;
  surename?: string | null;
  phoneNum?: string | null;
  email?: string | null;
  city?: string | null;
  profileSummary?: string | null;
}

interface UserProfileProps {
  user: {
    name?: string;
    email?: string;
    given_name?: string;
    family_name?: string;
    sub: string;
  };
  savedProfile?: SavedProfile | null;
}

export default function UserProfile({
  user,
  savedProfile = null,
}: UserProfileProps) {
  const displayName =
    savedProfile?.name ??
    user?.name ??
    user?.given_name ??
    (`${user?.given_name ?? ""} ${user?.family_name ?? ""}`.trim() ||
      "Użytkownik");

  const email = savedProfile?.email ?? user?.email ?? "brak email";

  return null;
}
