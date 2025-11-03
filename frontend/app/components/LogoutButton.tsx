"use client";

export default function LogoutButton({children} : {
  children: React.ReactNode
}) {
  return (
    <a
      href="/auth/logout"
      className="button logout"
    >
      {children}
    </a>
  );
}