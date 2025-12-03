"use client";

import { useEffect, useState } from "react";
import Card from "./Card";
import SectionHeader from "./SectionHeader";
import Badge from "./Badge";
import EmptyState from "./EmptyState";
import Button from "./Button";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";
import { FaUser, FaBriefcase, FaLightbulb, FaLink,FaEdit    } from "react-icons/fa";
import { IoSchoolSharp, IoLanguage } from "react-icons/io5";
import { AiFillSafetyCertificate } from "react-icons/ai";

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

// Ikony jako komponenty
// const Icons = {
//   User: () => (
//     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//     </svg>
//   ),
//   Education: () => (
//     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
//     </svg>
//   ),
//   Work: () => (
//     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//     </svg>
//   ),
//   Skills: () => (
//     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
//     </svg>
//   ),
//   Language: () => (
//     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
//     </svg>
//   ),
//   Link: () => (
//     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
//     </svg>
//   ),
//   Certificate: () => (
//     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
//     </svg>
//   ),
//   Edit: () => (
//     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//     </svg>
//   ),
// };

const Icons = {
  User: () => <FaUser/>,
  Education: () => <IoSchoolSharp/>,
  Work: () => <FaBriefcase/>,
  Skills: () => <FaLightbulb/>,
  Language: () => <IoLanguage/>,
  Link: () => <FaLink/>,
  Certificate: () => <AiFillSafetyCertificate/>,
  Edit: () => <FaEdit/>,
};

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
        if (mounted) setError("Nie udało się pobrać danych.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [fetchUrl]);

  if (loading) return <LoadingSpinner message="Ładowanie profilu..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!userData) return null;

  const hasEducation = userData.education && userData.education.length > 0;
  const hasExperience = userData.work_experiences && userData.work_experiences.length > 0;
  const hasAbilities = userData.abilities && userData.abilities.length > 0;
  const hasLanguages = userData.user_languages && userData.user_languages.length > 0;
  const hasLinks = userData.links && userData.links.length > 0;
  const hasCertificates = userData.certificates && userData.certificates.length > 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Nagłówek profilu z przyciskiem edycji */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">Mój profil</h1>
        <Button href="/profile/edit" variant="primary">
          <Icons.Edit />
          Edytuj profil
        </Button>
      </div>

      {/* -------------------------------- */}
      {/* DANE OSOBOWE */}
      {/* -------------------------------- */}
      <Card>
        <SectionHeader title="Dane osobowe" icon={<Icons.User />} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-sm text-muted">Imię</p>
            <p className="text-foreground font-medium text-lg">{userData.name}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted">Nazwisko</p>
            <p className="text-foreground font-medium text-lg">{userData.surname}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted">Email</p>
            <p className="text-foreground">{userData.email}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted">Telefon</p>
            <p className="text-foreground">{userData.phone_number || "—"}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted">Miasto</p>
            <p className="text-foreground">{userData.city || "—"}</p>
          </div>
        </div>

        {userData.profile_summary && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted mb-2">O mnie</p>
            <p className="text-foreground leading-relaxed">{userData.profile_summary}</p>
          </div>
        )}
      </Card>

      {/* -------------------------------- */}
      {/* EDUKACJA */}
      {/* -------------------------------- */}
      <Card>
        <SectionHeader title="Edukacja" icon={<Icons.Education />} />

        {hasEducation ? (
          <div className="space-y-4">
            {userData.education.map((edu, index) => (
              <div
                key={edu.id}
                className={`${index !== userData.education.length - 1 ? "border-b border-border pb-4" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-foreground font-semibold text-lg">{edu.school_name}</p>
                    <p className="text-primary font-medium">{edu.major}</p>
                    <p className="text-muted text-sm">{edu.degree}</p>
                  </div>
                  <Badge variant="default">
                    {new Date(edu.begin_date).getFullYear()} –{" "}
                    {edu.end_date ? new Date(edu.end_date).getFullYear() : "obecnie"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            message="Nie dodałeś jeszcze żadnej edukacji"
            actionLabel="Dodaj edukację"
          />
        )}
      </Card>

      {/* -------------------------------- */}
      {/* DOŚWIADCZENIE */}
      {/* -------------------------------- */}
      <Card>
        <SectionHeader title="Doświadczenie zawodowe" icon={<Icons.Work />} />

        {hasExperience ? (
          <div className="space-y-4">
            {userData.work_experiences!.map((exp, index) => (
              <div
                key={exp.id}
                className={`${index !== userData.work_experiences!.length - 1 ? "border-b border-border pb-4" : ""}`}
              >
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-foreground font-semibold text-lg">{exp.position}</p>
                    <p className="text-primary font-medium">{exp.company_name}</p>
                  </div>
                  <Badge variant="default">
                    {new Date(exp.begin_date).toLocaleDateString("pl-PL", {
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    –{" "}
                    {exp.end_date
                      ? new Date(exp.end_date).toLocaleDateString("pl-PL", {
                          month: "short",
                          year: "numeric",
                        })
                      : "obecnie"}
                  </Badge>
                </div>
                {exp.description && (
                  <p className="text-muted text-sm mt-2 leading-relaxed">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            message="Nie dodałeś jeszcze żadnego doświadczenia zawodowego"
            actionLabel="Dodaj doświadczenie"
          />
        )}
      </Card>

      {/* -------------------------------- */}
      {/* UMIEJĘTNOŚCI */}
      {/* -------------------------------- */}
      <Card>
        <SectionHeader title="Umiejętności" icon={<Icons.Skills />} />

        {hasAbilities ? (
          <div className="flex flex-wrap gap-2">
            {userData.abilities.map((ab) => (
              <Badge key={ab.id} variant="primary">
                {ab.name}
              </Badge>
            ))}
          </div>
        ) : (
          <EmptyState
            message="Nie dodałeś jeszcze żadnych umiejętności"
            actionLabel="Dodaj umiejętności"
          />
        )}
      </Card>

      {/* -------------------------------- */}
      {/* JĘZYKI */}
      {/* -------------------------------- */}
      <Card>
        <SectionHeader title="Języki obce" icon={<Icons.Language />} />

        {hasLanguages ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {userData.user_languages.map((lng, i) => (
              <div
                key={i}
                className="p-4 bg-secondary rounded-lg border border-border flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold text-sm uppercase">
                    {lng.language.code}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{lng.language.name}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            message="Nie dodałeś jeszcze żadnych języków"
            actionLabel="Dodaj języki"
          />
        )}
      </Card>

      {/* -------------------------------- */}
      {/* LINKI */}
      {/* -------------------------------- */}
      <Card>
        <SectionHeader title="Linki" icon={<Icons.Link />} />

        {hasLinks ? (
          <div className="flex flex-wrap gap-3">
            {userData.links!.map((lin) => (
              <a
                key={lin.id}
                href={lin.linkString}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-secondary hover:bg-border px-4 py-2 rounded-lg text-foreground transition-colors duration-200 border border-border"
              >
                <svg
                  className="w-4 h-4 text-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                <span className="text-sm truncate max-w-xs">
                  {lin.linkString.replace(/^https?:\/\//, "")}
                </span>
              </a>
            ))}
          </div>
        ) : (
          <EmptyState
            message="Nie dodałeś jeszcze żadnych linków"
            actionLabel="Dodaj linki"
          />
        )}
      </Card>

      {/* -------------------------------- */}
      {/* CERTYFIKATY */}
      {/* -------------------------------- */}
      <Card>
        <SectionHeader title="Certyfikaty" icon={<Icons.Certificate />} />

        {hasCertificates ? (
          <div className="space-y-4">
            {userData.certificates!.map((cert, index) => (
              <div
                key={cert.id}
                className={`flex items-start gap-4 ${index !== userData.certificates!.length - 1 ? "border-b border-border pb-4" : ""}`}
              >
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icons.Certificate />
                </div>
                <div className="flex-1">
                  <p className="text-foreground font-semibold">{cert.name}</p>
                  <p className="text-primary text-sm">{cert.issuer}</p>
                  <p className="text-muted text-xs mt-1">
                    Wydano: {new Date(cert.certification_date).toLocaleDateString("pl-PL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            message="Nie dodałeś jeszcze żadnych certyfikatów"
            actionLabel="Dodaj certyfikaty"
          />
        )}
      </Card>
    </div>
  );
}