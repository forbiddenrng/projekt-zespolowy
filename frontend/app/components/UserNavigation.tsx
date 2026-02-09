"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import { NavigationProps, NavItemProps } from "../ts/types";
import {
  FiHome,
  FiUser,
  FiFileText,
  FiCheckCircle,
  FiBriefcase,
  FiFolder,
  FiLogOut,
  FiBookOpen,
} from "react-icons/fi";

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
        ${
          isActive
            ? "bg-primary text-white shadow-md"
            : "text-muted hover:text-foreground hover:bg-secondary"
        }
      `}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export default function UserNavigation({ user }: NavigationProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: <FiHome />, label: "Dashboard" },
    { href: "/profile", icon: <FiUser />, label: "Profile" },
    { href: "/generate", icon: <FiFileText />, label: "Generate Document" },
    {
      href: "/evaluate",
      icon: <FiCheckCircle />,
      label: "Document Evaluation",
    },
    { href: "/jobs", icon: <FiBriefcase />, label: "Job Offers" },
    { href: "/workspace", icon: <FiFolder />, label: "Workspace" },
    { href: "/handbook", icon: <FiBookOpen />, label: "Handbook" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 pr-5 pl-5 bg-card_background shadow-lg flex flex-col z-50">
      {/* Logo Section */}
      <div className="p-6 border-b border-card_border">
        <div className="text-2xl">
          <Logo />
        </div>
      </div>

      {/* User Profile Section */}
      {user && (
        <div className="p-6 border-b border-card_border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {user.name?.charAt(0).toUpperCase() ||
                user.email?.charAt(0).toUpperCase() ||
                "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">
                {user.name || "User"}
              </p>
              <p className="text-sm text-muted truncate">
                {user.email || "email@example.com"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={pathname === item.href}
            />
          ))}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-card_border space-y-2">
        <div>
          <ThemeToggle />
        </div>

        {/* Logout Button */}
        <LogoutButton>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-error hover:bg-error/10 transition-all duration-200">
            <span className="text-xl">
              <FiLogOut />
            </span>
            <span className="font-medium">Sign out</span>
          </button>
        </LogoutButton>
      </div>
    </aside>
  );
}
