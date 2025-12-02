import { auth0 } from "../lib/auth0";
import UserNavigation from "../components/UserNavigation";
import WelcomePage from "../components/WelcomePage";
import UserData from "./components/UserData";
import NoProfileFound from "./components/NoProfileFound";
// import { jwtDecode } from "jwt-decode";
// import { redirect } from "next/navigation";

async function fetchProfile() {
  const accessTokenResp = await auth0.getAccessToken({
    audience: process.env.AUTH0_AUDIENCE,
  });

  const token =
    typeof accessTokenResp === "string"
      ? accessTokenResp
      : (accessTokenResp as any)?.token ?? null;

  // const decoded: any = jwtDecode(token);
  // const userID = encodeURIComponent(decoded.sub);

  const backendUrl = `${process.env.GATEWAY_URL}/users/me`;
  const gatewayRes = await fetch(backendUrl, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: "application/json",
    },
  });

  if (!gatewayRes.ok) return null;
  const responseBody = await gatewayRes.json();
  return responseBody?.data;
}

export default async function Profile() {

  let savedProfile = null;

  try {
    savedProfile = await fetchProfile();
  } catch (err: any) {
    console.error("Error fetching saved profile:", err?.message ?? err);
    savedProfile = null;
  }

  if (!savedProfile) return <NoProfileFound/>

  
  
  return (
    <UserData />
  );
}
