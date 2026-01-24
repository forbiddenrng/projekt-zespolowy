// Helper function to parse error detail (429 rate limit returns object)
export default function parseErrorDetail(
  errJson: any,
  defaultStatus: number,
): string {
  // Check detail field first (429 rate limit uses this)
  if (errJson?.detail) {
    // If detail is an object with message field (rate limit format)
    if (typeof errJson.detail === "object" && !Array.isArray(errJson.detail)) {
      if (errJson.detail.message) {
        return errJson.detail.message;
      }
      // Fallback: stringify the object
      return JSON.stringify(errJson.detail);
    }

    // If detail is an array (validation errors)
    if (Array.isArray(errJson.detail)) {
      return errJson.detail.map((e: any) => e.msg || e).join(", ");
    }

    // If detail is a string
    if (typeof errJson.detail === "string") {
      return errJson.detail;
    }
  }

  // Fallback to message field
  if (errJson?.message) {
    return errJson.message;
  }

  // Final fallback
  return `HTTP ${defaultStatus}`;
}
