export type SuccessResponse<T = any> = {
  status: "success";
  statusCode: number;
  data: T | null;
  message?: string | null;
}

export type ErrorResponse = {
  status: "error";
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path?: string;
}

export type FindOneQueryParams = {
  abilities: string, 
  certificates: string,
  education: string,
  languages: string,
  links: string,
  work: string,
  all: string
}