import { auth0 } from "../lib/auth0";
import UserNavigation from "../components/UserNavigation";
import WelcomePage from "../components/WelcomePage";
import UserData from "./components/UserData";
import ProfileWizard from "./components/ProfileWizard";
import { jwtDecode } from "jwt-decode";

async function fetchProfile() {
  const accessTokenResp = await auth0.getAccessToken({
    audience: process.env.AUTH0_AUDIENCE,
  });

  const token =
    typeof accessTokenResp === "string"
      ? accessTokenResp
      : (accessTokenResp as any)?.token ?? null;

  const decoded: any = jwtDecode(token);
  const userID = encodeURIComponent(decoded.sub);
  console.log("USERID", userID);

  const backendUrl = `${process.env.GATEWAY_URL}/users/me`;
  const gatewayRes = await fetch(backendUrl, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: "application/json",
    },
  });

  if (!gatewayRes.ok) return null; // some error
  const responseBody = await gatewayRes.json();
  return responseBody?.data;
}

export default async function Profile() {
  const session = await auth0.getSession();
  const user = session?.user;
  if (!user) return <WelcomePage />;

  let savedProfile = null;
  let userData = null;

  try {
    savedProfile = await fetchProfile();
  } catch (err: any) {
    console.error(
      "Error fetching saved profile on server:",
      err?.message ?? err
    );
    savedProfile = null;
  }

  console.log("---user---");
  console.log(user);
  console.log("---saved profile---");
  console.log(savedProfile);

  // Jeśli brak profilu → pokaz ProfileWizard
  if (!savedProfile) {
    return (
      <div className="min-h-screen bg-background pt-5">
        <UserNavigation user={user} />
        <ProfileWizard user={user} savedProfile={savedProfile} />
      </div>
    );
  }

  console.log("User has saved data, render userData component instead");

  return (
    <div className="min-h-screen bg-background pt-5">
      <UserNavigation user={user} />
      <div>
        <UserData />
      </div>
    </div>
  );
}
