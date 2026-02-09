import Feature from "./Feature";
import LoginButton from "./LoginButton";
import Navigation from "./Navigation";
import { features } from "../data/data";

export default async function WelcomePage() {
  const featuresList = features.map((feature) => (
    <Feature key={feature.id} {...feature} />
  ));

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={null} />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <h1 className="text-5xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight">
              JobMatch<span className="text-primary">.AI</span>
            </h1>
            <p className="text-xl lg:text-2xl text-muted mb-8 max-w-3xl mx-auto">
              Intelligent AI Resume & Cover Letter Generator
            </p>
            <p className="text-lg text-muted mb-12 max-w-2xl mx-auto">
              Boost your chances of landing your dream job with AI that tailors
              your documents to every application.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-primary hover:bg-primary_hover text-white rounded-lg font-semibold text-lg transition-colors duration-200 shadow-lg">
                <LoginButton>Get Started for Free</LoginButton>
              </button>
              <button className="px-8 py-4 bg-secondary text-foreground hover:bg-border rounded-lg font-semibold text-lg transition-colors duration-200 border border-border">
                See How It Works
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
              Core Features
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Everything you need to stand out in the recruitment process.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresList}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              A simple three-step process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Complete Your Profile
              </h3>
              <p className="text-muted">
                Enter your personal details, education, professional experience,
                and skills.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Paste a Job Offer
              </h3>
              <p className="text-muted">
                Copy the job description from any job board or company website.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-success text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Download Documents
              </h3>
              <p className="text-muted">
                AI generates a personalized CV and cover letter ready to be
                sent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Land Your Dream Job?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Join thousands of users who have already improved their chances in
            the job market.
          </p>
          <button className="px-10 py-5 bg-white text-primary hover:bg-gray-100 rounded-lg font-semibold text-lg transition-colors duration-200 shadow-xl cursor-pointer">
            Start Now - It's Free!
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-secondary border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-muted mb-4">
              © 2026 JobMatch.AI - All rights reserved
            </p>
            <div className="flex justify-center gap-6 text-sm text-muted">
              <a href="#" className="hover:text-primary transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
