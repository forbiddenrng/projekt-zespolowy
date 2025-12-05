"use client"

import React, { createContext, useContext, useState, ReactNode } from "react";
import type {
  UserFormValues,
  Education,
  WorkExp,
  Ability,
  Links,
  Certificate,
  UserLanguage,
} from "@/app/ts/types";

interface WizardData {
  userInfo: UserFormValues | null;
  education: Education[];
  workExperience: WorkExp[];
  abilities: Ability[];
  languages: UserLanguage[];
  links: Links[];
  certificates: Certificate[];
}

interface WizardContextType {
  wizardData: WizardData;
  updateUserInfo: (userInfo: UserFormValues) => void;
  updateEducation: (education: Education[]) => void;
  updateWorkExperience: (workExperience: WorkExp[]) => void;
  updateAbilities: (abilities: Ability[]) => void;
  updateLanguages: (languages: UserLanguage[]) => void;
  updateLinks: (links: Links[]) => void;
  updateCertificates: (certificates: Certificate[]) => void;
}

// const WizardContext = createContext<WizardContextType | undefined>(undefined);
const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({children}: {children: ReactNode}): React.ReactNode{
  const [wizardData, setWizardData] = useState<WizardData>({
    userInfo: null,
    education: [],
    workExperience: [],
    abilities: [],
    languages: [],
    links: [],
    certificates: [],
  });

  const updateUserInfo = (userInfo: UserFormValues) => {
    setWizardData((prev) => ({ ...prev, userInfo }));
  };

  const updateEducation = (education: Education[]) => {
    setWizardData((prev) => ({ ...prev, education }));
  };

  const updateWorkExperience = (workExperience: WorkExp[]) => {
    setWizardData((prev) => ({ ...prev, workExperience }));
  };

  const updateAbilities = (abilities: Ability[]) => {
    setWizardData((prev) => ({ ...prev, abilities }));
  };

  const updateLanguages = (languages: UserLanguage[]) => {
    setWizardData((prev) => ({ ...prev, languages }));
  };

  const updateLinks = (links: Links[]) => {
    setWizardData((prev) => ({ ...prev, links }));
  };

  const updateCertificates = (certificates: Certificate[]) => {
    setWizardData((prev) => ({ ...prev, certificates }));
  };

  return (
    <WizardContext.Provider
      value={{
        wizardData,
        updateUserInfo,
        updateEducation,
        updateWorkExperience,
        updateAbilities,
        updateLanguages,
        updateLinks,
        updateCertificates,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard(){
  const context = useContext(WizardContext);
  if(!context){
    throw new Error("useWizard must be used within WizardProvider")
  }
  return context;
}
