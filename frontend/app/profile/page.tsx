// app/profile.tsx (fragment serwerowy) — poprawiony
import { auth0 } from "../lib/auth0";
import UserNavigation from "../components/UserNavigation";
import WelcomePage from "../components/WelcomePage";
import UserProfile from "../components/UserProfile";
import UserForm from "../components/UserForm";

export default async function Profile() {
  const session = await auth0.getSession();
  const user = session?.user;
  if (!user) return <WelcomePage />;

  let savedProfile = null;

  try {
    // Pobierz odpowiedź od SDK
    const accessTokenResponse = await auth0.getAccessToken({
      audience: process.env.AUTH0_AUDIENCE,
    });

    // DEBUG — zobacz co zwraca SDK (usuń w prod)
    console.log("getAccessToken() returned:", accessTokenResponse);

    // defensywne wydobycie tokena:
    // - jeśli SDK zwróci string: użyj go,
    // - jeśli zwróci obiekt z polem `token`: użyj tego pola,
    // - fallback: null
    let token: string | null = null;
    if (typeof accessTokenResponse === "string") {
      token = accessTokenResponse;
    } else if (accessTokenResponse && typeof accessTokenResponse === "object") {
      // tutaj SDK zwraca: { token: string; expiresAt: number; ... }
      // dlatego odczytujemy `.token`
      token = (accessTokenResponse as { token?: string }).token ?? null;
    }

    if (!token) {
      console.error("No access token available to call backend. token:", token);
    } else {
      const backendUrl = `${
        process.env.API_URL
      }/users/profile?authId=${encodeURIComponent(user.sub)}`;
      const apiRes = await fetch(backendUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const text = await apiRes.text();
      try {
        const json = text ? JSON.parse(text) : null;
        savedProfile = json?.user ?? null;
      } catch (parseErr) {
        console.error(
          "Expected JSON from backend but got:",
          text.slice(0, 800)
        );
        savedProfile = null;
      }
    }
  } catch (err: any) {
    console.error(
      "Error fetching saved profile on server:",
      err?.message ?? err
    );
    savedProfile = null;
  }

  return (
    <div className="min-h-screen bg-background">
      <UserNavigation user={user} />
      <UserProfile user={user} savedProfile={savedProfile} />
      <UserForm user={user} savedProfile={savedProfile} />
    </div>
  );
}
