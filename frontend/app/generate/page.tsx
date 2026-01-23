import { auth0 } from "../lib/auth0";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FiFileText, FiMail, FiArrowRight } from "react-icons/fi";

export default async function GeneratePage() {
  const session = await auth0.getSession();
  const user = session?.user;

  if (!user) {
    redirect("/api/auth/login");
  }

  return (
    <div className="max-w-4xl mx-auto px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Generowanie dokumentów
        </h1>
        <p className="text-muted">
          Wykorzystaj AI, aby stworzyć profesjonalne dokumenty aplikacyjne
          dopasowane do oferty pracy
        </p>
      </div>

      {/* Wybór typu dokumentu */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Karta CV */}
        <Link href="/generate/cv">
          <Card className="h-full hover:border-primary hover:shadow-lg transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <FiFileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Generuj CV</CardTitle>
                  <CardDescription>
                    Stwórz profesjonalne CV w PDF
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                AI przeanalizuje Twój profil i ofertę pracy, aby stworzyć
                spersonalizowane CV maksymalizujące Twoje szanse na sukces.
              </p>
              <div className="flex items-center text-primary font-medium group-hover:gap-2 transition-all">
                <span>Rozpocznij</span>
                <FiArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Karta List motywacyjny */}
        <Link href="/generate/cover-letter">
          <Card className="h-full hover:border-primary hover:shadow-lg transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                  <FiMail className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    Generuj list motywacyjny
                  </CardTitle>
                  <CardDescription>
                    Stwórz profesjonalny list w PDF
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                AI stworzy spersonalizowany list motywacyjny dopasowany
                stylistycznie i merytorycznie do oferty pracy oraz firmy.
              </p>
              <div className="flex items-center text-accent font-medium group-hover:gap-2 transition-all">
                <span>Rozpocznij</span>
                <FiArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
