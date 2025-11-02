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
