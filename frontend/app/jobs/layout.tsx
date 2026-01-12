import UserNavigation from "../components/UserNavigation";
import WelcomePage from "../components/WelcomePage";
import { auth0 } from "../lib/auth0";

export default async function GenerateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth0.getSession();
  const user = session?.user;

  if (!user) return <WelcomePage />;

  return (
    <div className="min-h-screen bg-background pt-5">
      <UserNavigation user={user} />
      {children}
    </div>
  );
}
