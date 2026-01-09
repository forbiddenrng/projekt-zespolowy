import { auth0 } from "../lib/auth0";
import { redirect } from "next/navigation";
import GenerateCVForm from "./components/GenerateCVForm";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

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
          Generowanie CV
        </h1>
        <p className="text-muted">
          Wykorzystaj AI, aby stworzyć profesjonalne CV dopasowane do oferty
          pracy
        </p>
      </div>

      {/* Form */}
      <GenerateCVForm />
    </div>
  );
}
