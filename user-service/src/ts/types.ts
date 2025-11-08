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