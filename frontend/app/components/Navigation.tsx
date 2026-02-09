"use client";

import Link from "next/link";
import LoginButton from "./LoginButton";
import Logo from "./Logo";
import { NavigationProps } from "../ts/types";

export default function Navigation({ user }: NavigationProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="text-2xl">
            <Logo />
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="#features"
                className="text-muted hover:text-foreground transition-colors duration-200 font-medium"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="text-muted hover:text-foreground transition-colors duration-200 font-medium"
              >
                How it works
              </Link>
            </div>

            <div>
              <LoginButton>
                <span className="px-6 py-2 bg-primary hover:bg-primary_hover text-white rounded-lg font-semibold transition-colors duration-200 shadow-sm">
                  Sign in
                </span>
              </LoginButton>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
