"use client";

import { useEffect, useState } from "react";
import Card from "./Card";
import SectionHeader from "./SectionHeader";
import Badge from "./Badge";
import EmptyState from "./EmptyState";
import Button from "./Button";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";
import {
  FaUser,
  FaBriefcase,
  FaLightbulb,
  FaLink,
  FaEdit,
} from "react-icons/fa";
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

const Icons = {
  User: () => <FaUser />,
  Education: () => <IoSchoolSharp />,
  Work: () => <FaBriefcase />,
  Skills: () => <FaLightbulb />,
  Language: () => <IoLanguage />,
  Link: () => <FaLink />,
  Certificate: () => <AiFillSafetyCertificate />,
  Edit: () => <FaEdit />,
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
        if (mounted) setError("Failed to fetch profile data.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [fetchUrl]);

  if (loading) return <LoadingSpinner message="Loading profile..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!userData) return null;

  const hasEducation = userData.education && userData.education.length > 0;
  const hasExperience =
    userData.work_experiences && userData.work_experiences.length > 0;
  const hasAbilities = userData.abilities && userData.abilities.length > 0;
  const hasLanguages =
    userData.user_languages && userData.user_languages.length > 0;
  const hasLinks = userData.links && userData.links.length > 0;
  const hasCertificates =
    userData.certificates && userData.certificates.length > 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Header with Edit Button */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <Button href="/profile/edit" variant="primary">
          <Icons.Edit />
          Edit Profile
        </Button>
      </div>

      {/* PERSONAL DATA */}
      <Card editHref="/profile/edit/personal">
        <SectionHeader title="Personal Information" icon={<Icons.User />} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-sm text-muted">First Name</p>
            <p className="text-foreground font-medium text-lg">
              {userData.name}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted">Last Name</p>
            <p className="text-foreground font-medium text-lg">
              {userData.surname}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted">Email</p>
            <p className="text-foreground">{userData.email}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted">Phone Number</p>
            <p className="text-foreground">
              {userData.phone_number
                .trim()
                .match(/.{1,3}/g)
                ?.join(" ") || "—"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted">City</p>
            <p className="text-foreground">{userData.city || "—"}</p>
          </div>
        </div>

        {userData.profile_summary && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted mb-2">About Me</p>
            <p className="text-foreground leading-relaxed">
              {userData.profile_summary}
            </p>
          </div>
        )}
      </Card>

      {/* EDUCATION */}
      <Card editHref="/profile/edit/education">
        <SectionHeader title="Education" icon={<Icons.Education />} />

        {hasEducation ? (
          <div className="space-y-4">
            {userData.education.map((edu, index) => (
              <div
                key={edu.id}
                className={`${index !== userData.education.length - 1 ? "border-b border-border pb-4" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-foreground font-semibold text-lg">
                      {edu.school_name}
                    </p>
                    <p className="text-primary font-medium">{edu.major}</p>
                    <p className="text-muted text-sm">{edu.degree}</p>
                  </div>
                  <Badge variant="default">
                    {new Date(edu.begin_date).getFullYear()} –{" "}
                    {edu.end_date
                      ? new Date(edu.end_date).getFullYear()
                      : "present"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            message="You haven't added any education yet"
            actionLabel="Add Education"
            actionHref="/profile/edit/education"
          />
        )}
      </Card>

      {/* WORK EXPERIENCE */}
      <Card editHref="/profile/edit/work">
        <SectionHeader title="Work Experience" icon={<Icons.Work />} />

        {hasExperience ? (
          <div className="space-y-4">
            {userData.work_experiences!.map((exp, index) => (
              <div
                key={exp.id}
                className={`${index !== userData.work_experiences!.length - 1 ? "border-b border-border pb-4" : ""}`}
              >
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-foreground font-semibold text-lg">
                      {exp.position}
                    </p>
                    <p className="text-primary font-medium">
                      {exp.company_name}
                    </p>
                  </div>
                  <Badge variant="default">
                    {new Date(exp.begin_date).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    –{" "}
                    {exp.end_date
                      ? new Date(exp.end_date).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })
                      : "present"}
                  </Badge>
                </div>
                {exp.description && (
                  <p className="text-muted text-sm mt-2 leading-relaxed">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            message="You haven't added any work experience yet"
            actionLabel="Add Experience"
            actionHref="/profile/edit/work"
          />
        )}
      </Card>

      {/* ABILITIES / SKILLS */}
      <Card editHref="/profile/edit/abilities">
        <SectionHeader title="Skills" icon={<Icons.Skills />} />

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
            message="You haven't added any skills yet"
            actionLabel="Add Skills"
            actionHref="/profile/edit/abilities"
          />
        )}
      </Card>

      {/* LANGUAGES */}
      <Card editHref="/profile/edit/languages">
        <SectionHeader title="Languages" icon={<Icons.Language />} />

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
                  <p className="font-medium text-foreground">
                    {lng.language.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            message="You haven't added any languages yet"
            actionLabel="Add Languages"
            actionHref="/profile/edit/languages"
          />
        )}
      </Card>

      {/* LINKS */}
      <Card editHref="/profile/edit/links">
        <SectionHeader title="Links" icon={<Icons.Link />} />

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
            message="You haven't added any links yet"
            actionLabel="Add Links"
            actionHref="/profile/edit/links"
          />
        )}
      </Card>

      {/* CERTIFICATES */}
      <Card editHref="/profile/edit/certificates">
        <SectionHeader title="Certificates" icon={<Icons.Certificate />} />

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
                    Issued:{" "}
                    {new Date(cert.certification_date).toLocaleDateString(
                      "en-US",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            message="You haven't added any certificates yet"
            actionLabel="Add Certificates"
            actionHref="/profile/edit/certificates"
          />
        )}
      </Card>
    </div>
  );
}
