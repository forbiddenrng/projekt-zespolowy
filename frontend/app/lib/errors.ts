import { AxiosError } from "axios";

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public userMessage: string,
    public details?: any
  ){
    super(userMessage);
    this.name = "APIError"
  }
}



export function parseAxiosError(error: any): APIError{
  if(error.response){
    //server responded with error status
    const status = error.response.status;
    const data = error.response.data;

    // Try to extract meaningful message from backend
    let userMessage = data?.message || data?.error || "Request failed";

    // Customize messages based on status
    if (status === 400) {
      userMessage = data?.message || "Invalid input. Please check your data.";
    } else if (status === 401) {
      userMessage = "Unauthorized. Please login again.";
    } else if (status === 403) {
      userMessage = "You don't have permission to perform this action.";
    } else if (status === 404) {
      userMessage = "Resource not found.";
    } else if (status === 409) {
      userMessage = data?.message || "This resource already exists.";
    } else if (status === 422) {
      userMessage = data?.message || "Validation error. Please check your input.";
    } else if (status >= 500) {
      userMessage = "Server error. Please try again later.";
    }

    return new APIError(status, userMessage, data);
  }

  //network error (no response from backend)
  if(error.request){
    return new APIError(
      0,
      "Network error. Check your connection",
      error.message
    )
  }

  return new APIError(
    500,
    "An unexpected error occured",
    error.message
  )
}