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
          Generate Documents
        </h1>
        <p className="text-muted">
          Leverage AI to create professional application documents tailored to
          any job offer
        </p>
      </div>

      {/* Document Type Selection */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Resume Card */}
        <Link href="/generate/cv">
          <Card className="h-full hover:border-primary hover:shadow-lg transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <FiFileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Generate Resume</CardTitle>
                  <CardDescription>
                    Create a professional PDF resume
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                AI will analyze your profile and the job offer to create a
                personalized resume that maximizes your chances of success.
              </p>
              <div className="flex items-center text-primary font-medium group-hover:gap-2 transition-all">
                <span>Start Now</span>
                <FiArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Cover Letter Card */}
        <Link href="/generate/cover-letter">
          <Card className="h-full hover:border-primary hover:shadow-lg transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                  <FiMail className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    Generate Cover Letter
                  </CardTitle>
                  <CardDescription>
                    Create a professional PDF letter
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                AI will create a personalized cover letter tailored
                stylistically and substantively to the job offer and company.
              </p>
              <div className="flex items-center text-accent font-medium group-hover:gap-2 transition-all">
                <span>Start Now</span>
                <FiArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
