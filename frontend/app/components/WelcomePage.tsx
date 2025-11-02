import Feature from "./Feature";

import LoginButton from "./LoginButton";
import Navigation from "./Navigation";
import {features} from "../data/data";


export default async function WelcomePage() {

  const featuresList = features.map((feature) => (
    <Feature key={feature.id} {...feature}/>
  ))

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={null}/>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <h1 className="text-5xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight">
              JobMatch<span className="text-primary">.AI</span>
            </h1>
            <p className="text-xl lg:text-2xl text-muted mb-8 max-w-3xl mx-auto">
              Inteligentny Generator CV i Listów Motywacyjnych
            </p>
            <p className="text-lg text-muted mb-12 max-w-2xl mx-auto">
              Zwiększ swoje szanse na wymarzoną pracę dzięki AI, które dopasowuje Twoje dokumenty do każdej oferty
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-primary hover:bg-primary_hover text-white rounded-lg font-semibold text-lg transition-colors duration-200 shadow-lg">
                <LoginButton>
                  Rozpocznij za darmo
                </LoginButton>
              </button>
              <button className="px-8 py-4 bg-secondary text-foreground hover:bg-border rounded-lg font-semibold text-lg transition-colors duration-200 border border-border">
                Zobacz jak to działa
              </button>
            </div>
          </div>
        </div>


        {/* Decorative gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Główne funkcjonalności
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Wszystko czego potrzebujesz, aby wyróżnić się w procesie rekrutacji
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresList}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Jak to działa?
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Prosty proces w trzech krokach
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Uzupełnij profil
              </h3>
              <p className="text-muted">
                Wprowadź swoje dane osobowe, wykształcenie, doświadczenie zawodowe i umiejętności
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Wklej ofertę pracy
              </h3>
              <p className="text-muted">
                Skopiuj treść ogłoszenia z dowolnego portalu z ofertami pracy
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-success text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Pobierz dokumenty
              </h3>
              <p className="text-muted">
                AI generuje spersonalizowane CV i list motywacyjny gotowe do wysłania
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Gotowy, aby zdobyć wymarzoną pracę?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Dołącz do tysięcy użytkowników, którzy już zwiększyli swoje szanse na rynku pracy
          </p>
          <button className="px-10 py-5 bg-white text-primary hover:bg-gray-100 rounded-lg font-semibold text-lg transition-colors duration-200 shadow-xl cursor-pointer">
            Zacznij teraz - To darmowe!
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-secondary border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-muted mb-4">
              © 2025 JobMatch.AI - Wszystkie prawa zastrzeżone
            </p>
            <div className="flex justify-center gap-6 text-sm text-muted">
              <a href="#" className="hover:text-primary transition-colors">Polityka prywatności</a>
              <a href="#" className="hover:text-primary transition-colors">Regulamin</a>
              <a href="#" className="hover:text-primary transition-colors">Kontakt</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}