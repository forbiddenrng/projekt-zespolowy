"use client";

import React, { useState, useRef, useEffect } from "react";
import UserForm from "./UserForm";
import EducationForm from "./UserEducation";
import WorkExpForm from "./UserWorkExperience";
import UserAbilities from "./UserAbilities";
import UserLink from "./UserLink";
import UserCertyficates from "./UserCertyficates";
import UserLanguages from "./UserLanguage";
import { redirect } from "next/navigation";
import type {
  UserFormValues,
  Education,
  WorkExp,
  Ability,
  Links,
  Certificate,
  UserLanguage,
  Language,
} from "@/app/ts/types";
import { useWizard } from "../context/WizardContext";

interface ProfileWizardProps {
  user: {
    name?: string;
    email?: string;
    family_name?: string;
    given_name?: string;
    sub: string;
  };
  // savedProfile?: any;
}

type WizardStep =
  | "user"
  | "education"
  | "work"
  | "abilities"
  | "languages"
  | "links"
  | "certificates"
  | "summary";

interface WizardData {
  userInfo: UserFormValues | null;
  education: Education[];
  workExperience: WorkExp[];
  abilities: Ability[];
  languages: UserLanguage[];
  links: Links[];
  certificates: Certificate[];
}

export default function ProfileWizard({
  user,
  // savedProfile,
}: ProfileWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("user");
  // const [wizardData, setWizardData] = useState<WizardData>({
  //   userInfo: null,
  //   education: savedProfile?.education || [],
  //   workExperience: savedProfile?.workExperience || [],
  //   abilities: savedProfile?.abilities || [],
  //   languages: savedProfile?.languages || [],
  //   links: savedProfile?.links || [],
  //   certificates: savedProfile?.certificates || [],
  // });
  const {wizardData} = useWizard();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [allLanguages, setAllLanguages] = useState<Language[]>([]);

  useEffect(() => {
    fetch("/api/user/language/get")
      .then((res) => res.json())
      .then((json) => setAllLanguages(json.data || []))
      .catch(() => console.error("Failed to load languages"));
  }, []);

  const steps: { key: WizardStep; label: string }[] = [
    { key: "user", label: "Dane osobowe" },
    { key: "education", label: "Edukacja" },
    { key: "work", label: "Doświadczenie" },
    { key: "abilities", label: "Umiejętności" },
    { key: "languages", label: "Języki" },
    { key: "links", label: "Linki" },
    { key: "certificates", label: "Certyfikaty" },
    { key: "summary", label: "Podsumowanie" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  // const handleUserFormNext = (values: UserFormValues) => {
  //   setWizardData((prev) => ({ ...prev, userInfo: values }));
  //   setCurrentStep("education");
  // };

  // const handleEducationNext = (education: Education[]) => {
  //   setWizardData((prev) => ({ ...prev, education }));
  //   setCurrentStep("work");
  // };

  // const handleWorkNext = (workExperience: WorkExp[]) => {
  //   setWizardData((prev) => ({ ...prev, workExperience }));
  //   setCurrentStep("abilities");
  // };

  // const handleAbilitiesNext = (abilities: Ability[]) => {
  //   setWizardData((prev) => ({ ...prev, abilities }));
  //   setCurrentStep("languages");
  // };

  // const handleLanguagesNext = (languages: UserLanguage[]) => {
  //   setWizardData((prev) => ({ ...prev, languages }));
  //   setCurrentStep("links");
  // };

  // const handleLinksNext = (links: Links[]) => {
  //   setWizardData((prev) => ({ ...prev, links }));
  //   setCurrentStep("certificates");
  // };

  // const handleCertyficatesNext = (certyficates: Certificate[]) => {
  //   setWizardData((prev) => ({ ...prev, certyficates }));
  //   setCurrentStep("summary");
  // };

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
        certificates: wizardData.certificates,
        links: wizardData.links,
        workExperience: wizardData.workExperience,
        languages: wizardData.languages,
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
      redirect("/profile")
    } catch (err: any) {
      console.error("Submit error:", err);
      alert("Wystąpił błąd: " + (err?.message ?? "unknown"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- REF + auto-scroll dla kropek ---
  const stepsContainerRef = useRef<HTMLDivElement | null>(null);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Gdy zmieni się currentStepIndex, przewiń tak, aby aktywny step był wycentrowany.
  useEffect(() => {
    const el = stepRefs.current[currentStepIndex];
    if (el) {
      // scrollIntoView wewnątrz kontenera (inline center)
      el.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [currentStepIndex]);

  return (
    <div className="space-y-8">
      {/* Pasek postępu (auto-centrowanie aktywnego stepu, bez widocznego scrollbara) */}
      <div className="max-w-2xl mx-auto">
        <div
          ref={stepsContainerRef}
          className="wizard-steps overflow-x-auto -mx-2 px-2"
          style={{
            // ukrywamy pasek przewijania na większości przeglądarek
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {/* CSS do ukrycia webkit-scrollbar */}
          <style>{`
.wizard-steps::-webkit-scrollbar { display: none; }
`}</style>

          <div className="flex items-center justify-start mb-2 gap-6 min-w-max">
            {steps.map((step, index) => (
              <React.Fragment key={step.key}>
                <div
                  ref={(el) => {
                    stepRefs.current[index] = el;
                  }}
                  className="flex flex-col items-center w-20 text-center"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold shrink-0 transition-colors ${
                      index <= currentStepIndex
                        ? "bg-primary text-white"
                        : "bg-secondary text-muted border border-border"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`text-xs mt-1 leading-tight ${
                      index <= currentStepIndex
                        ? "text-foreground"
                        : "text-muted"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`h-[2px] w-10 rounded shrink-0 ${
                      index < currentStepIndex ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Zawartość kroków */}
      {currentStep === "user" && (
        <UserForm
          user={user}
          // savedProfile={savedProfile}
          // initialValues={wizardData.userInfo || savedProfile}
          onNext={() => setCurrentStep("education")}
        />
      )}

      {currentStep === "education" && (
        <EducationForm
          // initialEducation={wizardData.education}
          onBack={() => setCurrentStep("user")}
          onNext={() => setCurrentStep("work")}
        />
      )}

      {currentStep === "work" && (
        <WorkExpForm
          // initialWorkExp={wizardData.workExperience}
          onBack={() => setCurrentStep("education")}
          onNext={() => setCurrentStep("abilities")}
        />
      )}

      {currentStep === "abilities" && (
        <UserAbilities
          // initialAbilities={wizardData.abilities}
          onBack={() => setCurrentStep("work")}
          onNext={() => setCurrentStep("languages")}
        />
      )}

      {currentStep === "languages" && (
        <UserLanguages
          allLanguages={allLanguages}
          onBack={() => setCurrentStep("abilities")}
          onNext={() => setCurrentStep("links")}
        />
      )}

      {currentStep === "links" && (
        <UserLink
          // initialLinks={wizardData.links}
          onBack={() => setCurrentStep("abilities")}
          onNext={() => setCurrentStep("certificates")}
        />
      )}

      {currentStep === "certificates" && (
        <UserCertyficates
          // initialCertificates={wizardData.certificates}
          onBack={() => setCurrentStep("links")}
          onNext={() => setCurrentStep("summary")}
        />
      )}

      {currentStep === "summary" && (
        <SummaryStep
          data={wizardData}
          allLanguages={allLanguages}
          onBack={() => setCurrentStep("certificates")}
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
  onNext,
}: {
  user: any;
  onNext: () => void;
}) {
  return (
    <UserForm
      user={user}
      onNext={onNext}
    />
  );
}

// Krok podsumowania
function SummaryStep({
  data,
  allLanguages,
  onBack,
  onSubmit,
  isSubmitting,
}: {
  data: WizardData;
  allLanguages: Language[];
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

      {/* Języki */}
      <div className="mb-6 p-4 bg-secondary rounded-lg">
        <h3 className="font-medium text-foreground mb-3">
          Języki ({data.languages.length})
        </h3>
        <div className="space-y-2">
          {data.languages.map((l, i) => {
            const language = allLanguages.find((a) => a.id === l.languageId);
            return (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">
                    {language?.name || "Nieznany język"}
                  </div>
                  <div className="text-sm text-muted">{l.level}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Linki */}
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
              {lin.linkString}
            </span>
          ))}
        </div>
      </div>

      {/* Certyfikaty */}
      <div className="mb-6 p-4 bg-secondary rounded-lg">
        <h3 className="font-medium text-foreground mb-3">
          Certyfikaty ({data.certificates.length})
        </h3>
        {data.certificates.map((cert, index) => (
          <div
            key={index}
            className="mb-3 pb-3 border-b border-border last:border-0"
          >
            <p className="font-medium text-foreground">{cert.name}</p>
            <p className="text-sm text-muted">{cert.issuer}</p>
            <p className="text-xs text-muted">
              {new Date(cert.certificationDate).toLocaleDateString("pl-PL")} –{" "}
            </p>
          </div>
        ))}
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
