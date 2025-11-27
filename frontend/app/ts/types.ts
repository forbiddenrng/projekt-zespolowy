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
  endDate?: string;  // ISO format, opcjonalne
}

export interface EducationFormValues {
  education: Education[];
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