"use client";

import { useParams } from "next/navigation";
import EditPersonalForm from "./components/EditPersonalForm";
import EditAbilitiesForm from "./components/EditAbilitiesForm";
import EditEducationForm from "./components/EditEducationForm";
import EditWorkExperienceForm from "./components/EditWorkExperience";

export default function EditPage() {
  const params = useParams();
  const resource = params?.resource;

  // Mapowanie resource na tytuły i komponenty
  const resourceConfig: Record<string, { title: string }> = {
    personal: { title: "Dane osobowe" },
    education: { title: "Edukacja" },
    work: { title: "Doświadczenie zawodowe" },
    abilities: { title: "Umiejętności" },
    languages: { title: "Języki obce" },
    links: { title: "Linki" },
    certificates: { title: "Certyfikaty" },
  };

  const config = resourceConfig[resource as string] || { title: "Edycja" };


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
      // case "languages":
      //   return <EditLanguagesForm />;
      // case "links":
      //   return <EditLinksForm />;
      // case "certificates":
      //   return <EditCertificatesForm />;
      default:
        return (
          <div className="max-w-4xl mx-auto p-6 bg-card-background border border-card-border rounded-lg">
            <p className="text-muted">Komponent edycji dla "{resource}" jeszcze nie jest dostępny.</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
     {renderComponent()} 
    </div>
  );
}