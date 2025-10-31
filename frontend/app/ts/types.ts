export type IconColor = "accent" | "primary" | "success" | "warning";

export interface FeatureData {
  id: number;
  title: string;
  description: string;
  iconColor: IconColor;
}
