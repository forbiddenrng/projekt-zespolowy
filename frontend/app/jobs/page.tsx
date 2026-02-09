import { auth0 } from "../lib/auth0";
import { JobsResponse } from "./components/JobOfferModel";
import JobsClientInitializer from "./components/JobsClientInitializer";
import JobFilters from "./components/JobFilters";
import JobListWithPagination from "./components/JobListWithPagination";
import RetryButton from "./components/RetryButton";

async function getJobs(): Promise<JobsResponse> {
  const accessTokenResp = await auth0.getAccessToken({
    audience: process.env.AUTH0_AUDIENCE,
  });

  const token =
    typeof accessTokenResp === "string"
      ? accessTokenResp
      : ((accessTokenResp as any)?.token ?? null);

  const res = await fetch(`${process.env.GATEWAY_URL}/api/jobs`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Gateway returned ${res.status}`);
  }

  return res.json();
}

export default async function JobsPage() {
  try {
    const { data: jobs } = await getJobs();

    return (
      <>
        <JobsClientInitializer jobs={jobs} />

        <main className="min-h-screen bg-background py-12 px-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-10 space-y-2">
              <h1 className="text-5xl font-black text-foreground tracking-tight italic">
                EXPLORE<span className="text-primary">.</span>
              </h1>
              <p className="text-muted text-lg font-medium">
                Przeglądaj najnowsze oferty pracy dopasowane do Twoich
                umiejętności.
              </p>
            </div>

            <JobFilters />

            <JobListWithPagination />
          </div>
        </main>
      </>
    );
  } catch (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-card_background p-10 rounded-[2.5rem] border border-red-500/20 text-center shadow-2xl">
          <h2 className="text-2xl font-black text-foreground mb-4">
            Wystąpił błąd
          </h2>
          <p className="text-muted mb-6">
            Nie udało się załadować ofert pracy.
          </p>
          <RetryButton />
        </div>
      </div>
    );
  }
}
