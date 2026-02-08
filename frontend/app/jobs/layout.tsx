import { auth0 } from "../lib/auth0";
import UserNavigation from "../components/UserNavigation";
import WelcomePage from "../components/WelcomePage";
import { JobsProvider } from "./components/JobsContext";

export default async function JobOfferLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth0.getSession();
  const user = session?.user;

  if (!user) {
    return <WelcomePage />;
  }

  return (
    <JobsProvider>
      <div className="min-h-screen bg-background">
        <UserNavigation user={user as any} />
        <div className="pl-72">{children}</div>
      </div>
    </JobsProvider>
  );
}
