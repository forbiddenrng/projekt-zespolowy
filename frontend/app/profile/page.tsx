// app/profile.tsx (fragment serwerowy) — poprawiony
import { auth0 } from "../lib/auth0";
import UserNavigation from "../components/UserNavigation";
import WelcomePage from "../components/WelcomePage";
import UserProfile from "../components/UserProfile";
import UserForm from "../components/UserForm";


async function fetchProfile() {
  const accessTokenResp = await auth0.getAccessToken({
    audience: process.env.AUTH0_AUDIENCE,
  });
  
  const token = 
    typeof accessTokenResp === "string"
    ? accessTokenResp
    : (accessTokenResp as any)?.token ?? null;

   const backendUrl = `${process.env.GATEWAY_URL}/users/me`;
   const gatewayRes = await fetch(backendUrl, {
    headers: {
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
      Accept: "application/json",
    }
   }) 

   if(!gatewayRes.ok) return null; // some error
   const responseBody = await gatewayRes.json();
   return responseBody?.data;
}

export default async function Profile() {
  const session = await auth0.getSession();
  const user = session?.user;
  if (!user) return <WelcomePage />;

  let savedProfile = null;

  try {
    // Pobierz odpowiedź od SDK
    // const accessTokenResponse = await auth0.getAccessToken({
    //   audience: process.env.AUTH0_AUDIENCE,
    // });

    savedProfile = await fetchProfile();

    // try {
    //   const json = text ? JSON.parse(text) : null;
    //   savedProfile = json?.user ?? null;
    // } catch (parseErr) {
    //   console.error(
    //     "Expected JSON from backend but got:",
    //     text.slice(0, 800)
    //   );
    //   savedProfile = null;
    // }
    
  } catch (err: any) {
    console.error(
      "Error fetching saved profile on server:",
      err?.message ?? err
    );
    savedProfile = null;
  }

  console.log("---user---")
  console.log(user)
  console.log("---saved profile---")
  console.log(savedProfile)

  return (
    <div className="min-h-screen bg-background pt-5">
      <UserNavigation user={user} />
      <UserProfile user={user} savedProfile={savedProfile} />
      <UserForm user={user} savedProfile={savedProfile} />
    </div>
  );
}
