"use client";

import React, { useState } from "react";
import UserForm from "./UserForm";
import EducationForm from "./UserEducation";
import WorkExpForm from "./UserWorkExperience";
import UserAbilities from "./UserAbilities";
import UserLink from "./UserLink";
import type {
  UserFormValues,
  Education,
  WorkExp,
  Abilities,
  Links,
} from "@/app/ts/types";

interface ProfileWizardProps {
  user: {
    name?: string;
    email?: string;
    family_name?: string;
    given_name?: string;
    sub: string;
  };
  savedProfile?: any;
}

// Rozszerzone kroki: dodajemy 'abilities' (umiejętności)
type WizardStep =
  | "user"
  | "education"
  | "work"
  | "abilities"
  | "links"
  | "summary";

interface WizardData {
  userInfo: UserFormValues | null;
  education: Education[];
  workExperience: WorkExp[];
  abilities: Abilities[];
  links: Links[];
}

export default function ProfileWizard({
  user,
  savedProfile,
}: ProfileWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("user");
  const [wizardData, setWizardData] = useState<WizardData>({
    userInfo: null,
    education: savedProfile?.education || [],
    workExperience: savedProfile?.workExperience || [],
    abilities: savedProfile?.abilities || [],
    links: savedProfile?.links || [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps: { key: WizardStep; label: string }[] = [
    { key: "user", label: "Dane osobowe" },
    { key: "education", label: "Edukacja" },
    { key: "work", label: "Doświadczenie" },
    { key: "abilities", label: "Umiejętności" },
    { key: "links", label: "Linki" },
    { key: "summary", label: "Podsumowanie" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const handleUserFormNext = (values: UserFormValues) => {
    setWizardData((prev) => ({ ...prev, userInfo: values }));
    setCurrentStep("education");
  };

  const handleEducationNext = (education: Education[]) => {
    setWizardData((prev) => ({ ...prev, education }));
    setCurrentStep("work");
  };

  const handleWorkNext = (workExperience: WorkExp[]) => {
    setWizardData((prev) => ({ ...prev, workExperience }));
    setCurrentStep("abilities");
  };

  const handleAbilitiesNext = (abilities: Abilities[]) => {
    setWizardData((prev) => ({ ...prev, abilities }));
    setCurrentStep("links");
  };

  const handleLinksNext = (links: Links[]) => {
    setWizardData((prev) => ({ ...prev, links }));
    setCurrentStep("summary");
  };

  const handleFinalSubmit = async () => {
    if (!wizardData.userInfo) return;

    setIsSubmitting(true);

    try {
      const payload = {
        email: wizardData.userInfo.email,
        phoneNumber: wizardData.userInfo.phoneNum,
        name: wizardData.userInfo.name,
        surname: wizardData.userInfo.surname,
        city: wizardData.userInfo.city,
        profileSummary: wizardData.userInfo.profileSummary,
        education: wizardData.education,
        abilities: wizardData.abilities,
        certificates: [],
        links: wizardData.links,
        workExperience: wizardData.workExperience,
        languages: [],
      };

      console.log("[ProfileWizard] SENDING PAYLOAD:", payload);

      // Zanim wyśle się request trzeba najpierw sprawdzić na jaki endpoint go wysłać
      // trzeba wysłać request na /users/profile-exists
      // jeżeli profile-exists zwróci że profil istnieje to trzeba dokonac updata
      // jeżeli zwróci że nie istnieje to trzeba dokonać edycji
      //UWAGA: endpoint do edycji całościowej tj. z podaniem wszystkich pól edukacja, umiejętności itd. nie istnieje
      // możliwa jest na razie tylko edycja poszczególnych pól poprzez dedykowane endpointy. Zobacz README.md w user-service

      const res = await fetch("/api/user/create", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `Server returned ${res.status}`);
      }

      const data = await res.json();
      console.log("[ProfileWizard] SUCCESS:", data);
      alert("Profil zapisany pomyślnie!");
    } catch (err: any) {
      console.error("Submit error:", err);
      alert("Wystąpił błąd: " + (err?.message ?? "unknown"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Pasek postępu */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    index <= currentStepIndex
                      ? "bg-primary text-white"
                      : "bg-secondary text-muted border border-border"
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`text-sm mt-2 ${
                    index <= currentStepIndex ? "text-foreground" : "text-muted"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 rounded ${
                    index < currentStepIndex ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Zawartość kroków */}
      {currentStep === "user" && (
        <UserFormStep
          user={user}
          savedProfile={savedProfile}
          initialValues={wizardData.userInfo || savedProfile}
          onNext={handleUserFormNext}
        />
      )}

      {currentStep === "education" && (
        <EducationForm
          initialEducation={wizardData.education}
          onBack={() => setCurrentStep("user")}
          onNext={handleEducationNext}
        />
      )}

      {currentStep === "work" && (
        <WorkExpForm
          initialWorkExp={wizardData.workExperience}
          onBack={() => setCurrentStep("education")}
          onNext={handleWorkNext}
        />
      )}

      {currentStep === "abilities" && (
        <UserAbilities
          initialAbilities={wizardData.abilities}
          onBack={() => setCurrentStep("work")}
          onNext={handleAbilitiesNext}
        />
      )}

      {currentStep === "links" && (
        <UserLink
          initialLinks={wizardData.links}
          onBack={() => setCurrentStep("abilities")}
          onNext={handleLinksNext}
        />
      )}

      {currentStep === "summary" && (
        <SummaryStep
          data={wizardData}
          onBack={() => setCurrentStep("links")}
          onSubmit={handleFinalSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

// Zmodyfikowany UserForm dla wizarda
function UserFormStep({
  user,
  savedProfile,
  initialValues,
  onNext,
}: {
  user: any;
  savedProfile: any;
  initialValues: UserFormValues;
  onNext: (values: UserFormValues) => void;
}) {
  return (
    <UserForm
      user={user}
      savedProfile={savedProfile}
      initialValues={initialValues}
      onNext={onNext}
    />
  );
}

// Krok podsumowania
function SummaryStep({
  data,
  onBack,
  onSubmit,
  isSubmitting,
}: {
  data: WizardData;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="max-w-2xl mx-auto p-6 bg-card_background border border-card_border rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">
        Podsumowanie
      </h2>

      {/* Dane osobowe */}
      {data.userInfo && (
        <div className="mb-6 p-4 bg-secondary rounded-lg">
          <h3 className="font-medium text-foreground mb-3">Dane osobowe</h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted">Imię i nazwisko:</dt>
            <dd className="text-foreground">
              {data.userInfo.name} {data.userInfo.surname}
            </dd>
            <dt className="text-muted">Email:</dt>
            <dd className="text-foreground">{data.userInfo.email}</dd>
            <dt className="text-muted">Telefon:</dt>
            <dd className="text-foreground">{data.userInfo.phoneNum}</dd>
            <dt className="text-muted">Miasto:</dt>
            <dd className="text-foreground">{data.userInfo.city}</dd>
          </dl>
        </div>
      )}

      {/* Edukacja */}
      <div className="mb-6 p-4 bg-secondary rounded-lg">
        <h3 className="font-medium text-foreground mb-3">
          Edukacja ({data.education.length})
        </h3>
        {data.education.map((edu, index) => (
          <div
            key={index}
            className="mb-3 pb-3 border-b border-border last:border-0"
          >
            <p className="font-medium text-foreground">{edu.schoolName}</p>
            <p className="text-sm text-muted">
              {edu.major} • {edu.degree}
            </p>
            <p className="text-xs text-muted">
              {new Date(edu.beginDate).toLocaleDateString("pl-PL")} –{" "}
              {edu.endDate
                ? new Date(edu.endDate).toLocaleDateString("pl-PL")
                : "obecnie"}
            </p>
          </div>
        ))}
      </div>

      {/* Doświadczenie zawodowe */}
      <div className="mb-6 p-4 bg-secondary rounded-lg">
        <h3 className="font-medium text-foreground mb-3">
          Doświadczenie ({data.workExperience.length})
        </h3>
        {data.workExperience.map((we, index) => (
          <div
            key={index}
            className="mb-3 pb-3 border-b border-border last:border-0"
          >
            <p className="font-medium text-foreground">{we.companyName}</p>
            <p className="text-sm text-muted">{we.position}</p>
            <p className="text-xs text-muted">
              {we.beginDate
                ? new Date(we.beginDate).toLocaleDateString("pl-PL")
                : ""}{" "}
              –{" "}
              {we.endDate
                ? new Date(we.endDate).toLocaleDateString("pl-PL")
                : "obecnie"}
            </p>
            <p className="text-sm text-foreground mt-1">{we.description}</p>
          </div>
        ))}
      </div>

      {/* Umiejętności */}
      <div className="mb-6 p-4 bg-secondary rounded-lg">
        <h3 className="font-medium text-foreground mb-3">
          Umiejętności ({data.abilities.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {data.abilities.map((ab, i) => (
            <span
              key={i}
              className="text-sm bg-border px-3 py-1 rounded-full text-foreground"
            >
              {ab.name}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-6 p-4 bg-secondary rounded-lg">
        <h3 className="font-medium text-foreground mb-3">
          Linki ({data.links.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {data.links.map((lin, i) => (
            <span
              key={i}
              className="text-sm bg-border px-3 py-1 rounded-full text-foreground"
            >
              {lin.link}
            </span>
          ))}
        </div>
      </div>

      {/* Przyciski */}
      <div className="flex justify-between gap-4 pt-6 border-t border-border">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 bg-secondary border border-border text-foreground hover:bg-border rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Wstecz
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            "Zapisuję..."
          ) : (
            <>
              Zapisz profil
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
