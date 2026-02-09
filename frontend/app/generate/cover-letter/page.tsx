import { auth0 } from "@/app/lib/auth0";
import { redirect } from "next/navigation";
import GenerateCoverLetterForm from "../components/GenerateCoverLetterForm";

export default async function GenerateCoverLetterPage() {
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
          Generate Cover Letter
        </h1>
        <p className="text-muted">
          Use AI to create a professional cover letter tailored to a specific
          job offer and company
        </p>
      </div>

      {/* Form */}
      <GenerateCoverLetterForm />
    </div>
  );
}
