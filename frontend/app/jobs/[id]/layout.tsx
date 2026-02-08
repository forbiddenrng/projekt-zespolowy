import React from "react";

export default function JobDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-500">
      {/* Możesz tutaj dodać np. breadcrumbs (ścieżkę okruszków) 
          lub dodatkowy pasek akcji widoczny tylko w szczegółach 
      */}
      <div className="relative">{children}</div>

      {/* Footer specyficzny dla oferty, np. z przyciskiem szybkiej aplikacji na mobile */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-card_background border-t border-card_border z-40">
        <button className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg">
          Aplikuj na to stanowisko
        </button>
      </footer>
    </div>
  );
}
