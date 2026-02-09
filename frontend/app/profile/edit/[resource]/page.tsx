"use client";

import { useParams } from "next/navigation";
import EditPersonalForm from "./components/EditPersonalForm";
import EditAbilitiesForm from "./components/EditAbilitiesForm";
import EditEducationForm from "./components/EditEducationForm";
import EditWorkExperienceForm from "./components/EditWorkExperienceForm";
import EditCertificatesForm from "./components/EditCertificatesForm";
import EditLanguagesForm from "./components/EditLanguagesForm";
import EditLinksForm from "./components/EditLinksForm";

export default function EditPage() {
  const params = useParams();
  const resource = params?.resource;

  // Mapping resources to English titles
  const resourceConfig: Record<string, { title: string }> = {
    personal: { title: "Personal Data" },
    education: { title: "Education" },
    work: { title: "Work Experience" },
    abilities: { title: "Skills" },
    languages: { title: "Languages" },
    links: { title: "Links" },
    certificates: { title: "Certificates" },
  };

  const config = resourceConfig[resource as string] || { title: "Edit" };

  const renderComponent = () => {
    switch (resource) {
      case "personal":
        return <EditPersonalForm />;
      case "education":
        return <EditEducationForm />;
      case "work":
        return <EditWorkExperienceForm />;
      case "abilities":
        return <EditAbilitiesForm />;
      case "languages":
        return <EditLanguagesForm />;
      case "links":
        return <EditLinksForm />;
      case "certificates":
        return <EditCertificatesForm />;
      default:
        return (
          <div className="max-w-4xl mx-auto p-6 bg-card-background border border-card-border rounded-lg">
            <p className="text-muted">
              The edit component for "{resource}" is not yet available.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="sr-only">{config.title}</h1>
      {renderComponent()}
    </div>
  );
}
