import { auth0 } from "@/app/lib/auth0";
import { redirect } from "next/navigation";
import GenerateCVForm from "../components/GenerateCVForm";

export default async function GenerateCVPage() {
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
          Generate Resume
        </h1>
        <p className="text-muted">
          Leverage AI to create a professional resume tailored to a specific job
          offer
        </p>
      </div>

      {/* Form */}
      <GenerateCVForm />
    </div>
  );
}
