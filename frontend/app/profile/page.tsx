import { auth0 } from "../lib/auth0";
import UserNavigation from "../components/UserNavigation";
import WelcomePage from "../components/WelcomePage";
import UserProfile from "../components/UserProfile";

export default async function Profile() {
  const session = await auth0.getSession();
  const user = session?.user;

  if (user === null || user === undefined) return <WelcomePage/>

  return (
    <div className="min-h-screen bg-background">
      <UserNavigation user={user}/>
      <UserProfile/>
    </div>
  );
}