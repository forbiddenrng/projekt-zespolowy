import Link from "next/link";

export default function NoProfileFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card-background border border-card-border rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <svg
            className="w-20 h-20 mx-auto text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-3">
          Profile Not Found
        </h2>

        <p className="text-muted mb-6">
          It looks like you haven't created a profile yet. Set up your profile
          to take full advantage of the application.
        </p>

        <Link
          href="/profile/create"
          className="inline-block bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          Create Profile
        </Link>
      </div>
    </div>
  );
}
