import { auth0 } from "../../lib/auth0";
import ProfileWizard from "./components/ProfileWizard";
import { WizardProvider } from "./context/WizardContext";

async function fetchProfile() {
  const accessTokenResp = await auth0.getAccessToken({
    audience: process.env.AUTH0_AUDIENCE,
  });

  const token =
    typeof accessTokenResp === "string"
      ? accessTokenResp
      : (accessTokenResp as any)?.token ?? null;

  const backendUrl = `${process.env.NEXT_PUBLIC_GATEWAY_URL}/users/me`;
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

  if (!user) {
    throw new Error("User session not found"); // albo redirect na stronę logowania
  }

  let savedProfile = null;

  try {
    savedProfile = await fetchProfile();
  } catch (err: any) {
    console.error(
      "Error fetching saved profile on server:",
      err?.message ?? err
    );
    savedProfile = null;
  }

  return (
    <WizardProvider>
      <ProfileWizard user={user} />
    </WizardProvider>
  );
}
