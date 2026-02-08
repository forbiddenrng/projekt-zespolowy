import { auth0 } from "../lib/auth0";
import JobRow from "./components/JobRow";
import { JobsResponse } from "./components/JobOfferModel";

async function getJobs(): Promise<JobsResponse> {
  const accessTokenResp = await auth0.getAccessToken({
    audience: process.env.AUTH0_AUDIENCE,
  });

  const token =
    typeof accessTokenResp === "string"
      ? accessTokenResp
      : ((accessTokenResp as any)?.token ?? null);

  const res = await fetch(`${process.env.NEXT_PUBLIC_GATEWAY_URL}/api/jobs`, {
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
    const { data: jobs, total } = await getJobs();

    return (
      /* ZMIANA: Dodano ml-72 aby odsunąć treść od fixed paska bocznego */
      <main className="min-h-screen bg-background py-12 px-8 ml-72">
        <div className="max-w-5xl mx-auto">
          {/* Header Sekcji */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6 border-b border-card_border pb-8">
            <div className="space-y-1">
              <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
                Oferty Pracy
              </h1>
              <p className="text-muted text-lg">
                Znajdź stanowisko idealnie dopasowane do Twojego profilu.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-card_background p-2 rounded-2xl border border-card_border shadow-sm px-6">
              <span className="text-3xl font-black text-primary">{total}</span>
              <span className="text-sm text-muted uppercase font-bold leading-tight">
                Dostępnych
                <br />
                Ofert
              </span>
            </div>
          </div>

          {/* Lista ofert */}
          <div className="space-y-4">
            {jobs.length > 0 ? (
              jobs.map((job) => <JobRow key={job.id} job={job} />)
            ) : (
              <div className="bg-card_background rounded-2xl p-20 text-center border border-dashed border-card_border">
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Brak ofert
                </h3>
                <p className="text-muted mt-2 italic">
                  Obecnie nie znaleźliśmy ofert spełniających kryteria.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  } catch (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen ml-72">
        <div className="max-w-md w-full bg-card_background p-8 rounded-2xl border border-red-500/20 shadow-xl text-center">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Błąd połączenia
          </h2>
          <p className="text-muted mb-6">Nie udało się pobrać ofert.</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }
}
