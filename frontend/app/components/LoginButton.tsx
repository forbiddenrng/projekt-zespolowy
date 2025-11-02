"use client";

export default function LoginButton({children}: {children: React.ReactNode}) {
  return (
    <a
      href="/auth/login"
      className="button login"
    >
      {children}
    </a>
  );
}