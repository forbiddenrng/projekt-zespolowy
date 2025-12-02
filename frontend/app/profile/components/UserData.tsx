"use client";

import { useEffect, useState } from "react";

interface UserDataProps {
  id: number;
  auth0_id: string;
  name: string;
  surname: string;
  phone_number: string;
  email: string;
  city: string;
  profile_summary?: string;
  abilities: {
    id: number;
    name: string;
  }[];
  certificates?: {
    id: number;
    name: string;
    issuer: string;
    certification_date: string;
  }[];
  education: {
    id: number;
    school_name: string;
    major: string;
    degree: string;
    begin_date: string;
    end_date?: string;
  }[];
  links?: {
    id: number;
    linkString: string;
  }[];
  work_experiences?: {
    id: number;
    company_name: string;
    position: string;
    begin_date: string;
    end_date?: string;
    description: string;
  }[];
  user_languages: {
    language: {
      id: number;
      name: string;
      code: string;
    };
  }[];
}

export default function UserData({ fetchUrl = "/api/user/get" }) {
  const [userData, setUserData] = useState<UserDataProps | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetch(fetchUrl)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
        const json = await res.json();
        const data = json?.data ?? [];
        if (typeof data !== "object") throw new Error("Invalid data format");

        if (mounted) setUserData(data);
      })
      .catch(() => {
        if (mounted) setError("Nie udało się pobrać listy języków.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [fetchUrl]);

  if (loading) return <p className="text-center mt-10">Ładowanie...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;
  if (!userData) return null;

  console.log("USER_DATA: ", userData?.links);
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* -------------------------------- */}
      {/* DANE OSOBOWE */}
      {/* -------------------------------- */}
      <section className="p-6 bg-card_background border border-card_border rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          Dane osobowe
        </h2>

        {!userData ? (
          <p className="text-muted">Brak danych użytkownika...</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted">Imię</p>
              <p className="text-foreground font-medium">{userData.name}</p>
            </div>

            <div>
              <p className="text-muted">Nazwisko</p>
              <p className="text-foreground font-medium">{userData.surname}</p>
            </div>

            <div>
              <p className="text-muted">Email</p>
              <p className="text-foreground">{userData.email}</p>
            </div>

            <div>
              <p className="text-muted">Telefon</p>
              <p className="text-foreground">{userData.phone_number}</p>
            </div>

            <div>
              <p className="text-muted">Miasto</p>
              <p className="text-foreground">{userData.city}</p>
            </div>
          </div>
        )}
      </section>

      {/* -------------------------------- */}
      {/* EDUKACJA */}
      {/* -------------------------------- */}
      <section className="p-6 bg-card_background border border-card_border rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Edukacja</h2>

        <div className="space-y-4">
          {userData?.education.map((edu) => (
            <div key={edu.id} className="border-b border-border pb-3">
              <p className="text-foreground font-medium">{edu.school_name}</p>
              <p className="text-muted text-sm">
                {edu.major} • {edu.degree}
              </p>
              <p className="text-xs text-muted">
                {new Date(edu.begin_date).toLocaleDateString("pl-PL")} –{" "}
                {edu.end_date
                  ? new Date(edu.end_date).toLocaleDateString("pl-PL")
                  : "obecnie"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------- */}
      {/* DOŚWIADCZENIE */}
      {/* -------------------------------- */}
      <section className="p-6 bg-card_background border border-card_border rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          Doświadczenie
        </h2>

        <div className="space-y-4">
          {userData?.work_experiences?.map((exp) => (
            <div key={exp.id} className="border-b border-border pb-3">
              <p className="text-foreground font-medium">
                {exp.company_name} — {exp.position}
              </p>
              <p className="text-xs text-muted">
                {new Date(exp.begin_date).toLocaleDateString("pl-PL")} –{" "}
                {exp.end_date
                  ? new Date(exp.end_date).toLocaleDateString("pl-PL")
                  : "obecnie"}
              </p>
              <p className="text-sm text-foreground mt-1">{exp.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------- */}
      {/* UMIEJĘTNOŚCI */}
      {/* -------------------------------- */}
      <section className="p-6 bg-card_background border border-card_border rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          Umiejętności
        </h2>
        <div className="flex flex-wrap gap-2">
          {userData?.abilities.map((ab) => (
            <span
              key={ab.id}
              className="text-sm bg-secondary px-3 py-1 rounded-full text-foreground"
            >
              {ab.name}
            </span>
          ))}
        </div>
      </section>

      {/* -------------------------------- */}
      {/* JĘZYKI */}
      {/* -------------------------------- */}
      <section className="p-6 bg-card_background border border-card_border rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Języki</h2>

        <div className="space-y-2">
          {userData?.user_languages.map((lng, i) => (
            <div key={i} className="p-3 bg-secondary rounded-lg">
              <p className="font-medium text-foreground">{lng.language.name}</p>
              <p className="text-sm text-muted">{lng.language.code}</p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------- */}
      {/* LINKI */}
      {/* -------------------------------- */}
      <section className="p-6 bg-card_background border border-card_border rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Linki</h2>

        <div className="flex flex-wrap gap-2">
          {userData?.links?.map((lin) => (
            <a
              key={lin.id}
              href={lin.linkString}
              target="_blank"
              className="text-sm bg-border px-3 py-1 rounded-full text-foreground hover:opacity-80"
            >
              {lin.linkString}
            </a>
          ))}
        </div>
      </section>

      {/* -------------------------------- */}
      {/* CERTYFIKATY */}
      {/* -------------------------------- */}
      <section className="p-6 bg-card_background border border-card_border rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          Certyfikaty
        </h2>

        <div className="space-y-4">
          {userData?.certificates?.map((cert) => (
            <div key={cert.id} className="border-b border-border pb-3">
              <p className="text-foreground font-medium">{cert.name}</p>
              <p className="text-muted text-sm">{cert.issuer}</p>
              <p className="text-xs text-muted">
                {new Date(cert.certification_date).toLocaleDateString("pl-PL")}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
