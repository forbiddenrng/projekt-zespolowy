export type IconColor = "accent" | "primary" | "success" | "warning";

export interface FeatureData {
  id: number;
  title: string;
  description: string;
  iconColor: IconColor;
}

export interface NavigationProps {
  user?: any;
}

export interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

export interface UserFormValues {
  name: string;
  surname: string;
  phoneNum: string;
  email: string;
  city: string;
  profileSummary: string;
}

export interface SavedProfile {
  name?: string | null;
  surname?: string | null;
  phone_number?: string | null;
  email?: string | null;
  city?: string | null;
  profile_summary?: string | null;
}

// Nowe typy dla edukacji
export interface Education {
  schoolName: string;
  major: string;
  degree: string;
  beginDate: string; // ISO format
  endDate?: string; // ISO format, opcjonalne
}

export interface EducationFormValues {
  education: Education[];
}

//Typy dla doświadczenia zawodowego
export interface WorkExp {
  companyName: string;
  position: string;
  beginDate: string; // ISO format
  endDate?: string; // ISO format, opcjonalne
  description: string;
}

export interface WorkExpFormValues {
  workExp: WorkExp[];
}

// Typy dla umiejętności
export interface Ability {
  name: string;
}

export interface AbilitiesFormValues {
  abilities: Ability[];
}

// Typy dla linków
export interface Links {
  linkString: string;
}

export interface LinksFormValues {
  links: Links[];
}

// Typy dla certyfikatów
export interface Certificate {
  name: string;
  issuer: string;
  certificationDate: string; //ISO format
}

export interface CertificatesFormValues {
  certyficates: Certificate[];
}

// Typy dla jezyków
// Languages types (add to types.ts)
export interface Language {
  id: number;
  name: string;
  code?: string;
}

export enum LanguageLevel {
  A0 = "A0",
  A1 = "A1",
  A2 = "A2",
  A2_PLUS = "A2+",
  B1 = "B1",
  B2 = "B2",
  B2_PLUS = "B2+",
  C1 = "C1",
  C2 = "C2",
  NATIVE = "Native",
}

export interface UserLanguage {
  // opcjonalne id rekordu (np. z bazy)
  id?: number;
  languageId: number | null;
  level: LanguageLevel;
}

export interface UserLanguagesFormValues {
  languages: UserLanguage[];
}

// Pełny profil użytkownika
export interface FullProfilePayload extends UserFormValues {
  education: Education[];
  abilities: string[];
  certificates: string[];
  links: string[];
  workExperience: any[];
  languages: any[];
}
