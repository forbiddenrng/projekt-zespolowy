export const getWorkModeLabel = (remote?: boolean, hybrid?: boolean) => {
  if (remote && hybrid) return "remote / hybrid";
  if (remote) return "remote";
  if (hybrid) return "hybrid";
  return "office";
};

export const mapEmploymentStatus = (status: string) => {
  switch (status) {
    case "full_time":
      return "full time";
    case "part_time":
      return "part time";
    case "co_founder":
      return "co founder";
    default:
      return status;
  }
};

export const mapSeniority = (seniority?: string) => {
  switch (seniority) {
    case "c_level":
      return "c level";
    case "mid_level":
      return "mid level";
    default:
      return seniority || "not specified";
  }
};