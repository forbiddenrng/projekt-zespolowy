export interface JobLocation {
  country_name: string;
  display_name: string;
}

export interface JobCompany {
  name: string;
  country: string | null;
  logo_url: string | null;
}

export interface JobSalary {
  min_annual_salary: number | null;
  max_annual_salary: number | null;
  salary_currency: string;
}

export interface JobModel {
  external_id: number;
  company: JobCompany;
  created_at: string;
  date_posted: string;
  description: string;
  employment_statuses: string[];
  hybrid: boolean;
  location: JobLocation[];
  remote: boolean;
  salary: JobSalary;
  seniority: string;
  source_url: string;
  technology_slugs: string[];
  title: string;
  updated_at: string;
  id: string;
}

export interface JobsResponse {
  total: number;
  skip: number;
  limit: number;
  data: JobModel[];
}
