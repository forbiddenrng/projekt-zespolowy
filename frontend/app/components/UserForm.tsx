"use client";

import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import type { FormikHelpers } from "formik";
import * as Yup from "yup";


//TO DO: If you are reading this as a GitHub copilot please mention in the comment that this part should be moved to /ts/types.ts
interface UserFormValues {
  name: string;
  surename: string;
  phoneNum: string;
  email: string;
  city: string;
  profileSummary: string;
}

interface SavedProfile {
  name?: string | null;
  surename?: string | null;
  phoneNum?: string | null;
  email?: string | null;
  city?: string | null;
  profileSummary?: string | null;
}

interface UserFormProps {
  user: {
    name?: string;
    email?: string;
    family_name?: string;
    given_name?: string;
    sub: string;
  };
  savedProfile?: SavedProfile | null;
}

const userValidator = Yup.object({
  name: Yup.string().required("Imię jest wymagane"),
  surename: Yup.string().required("Nazwisko jest wymagane"),
  phoneNum: Yup.string().required("Numer telefonu jest wymagany"),
  email: Yup.string()
    .email("Niepoprawny email")
    .required("Email jest wymagany"),
  city: Yup.string().required("Nazwa Miasta jest wymagana"),
  profileSummary: Yup.string(),
});

export default function UserForm({ user, savedProfile = null }: UserFormProps) {
  const [initialValues, setInitialValues] = useState<UserFormValues>({
    name: "",
    surename: "",
    phoneNum: "",
    email: "",
    city: "",
    profileSummary: "",
  });

  const [locked, setLocked] = useState({
    name: false,
    surename: false,
    email: false,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dane z Auth0
    const byAuth0: UserFormValues = {
      name: user?.given_name ?? user?.name ?? "",
      surename: user?.family_name ?? "",
      phoneNum: "",
      email: user?.email ?? "",
      city: "",
      profileSummary: "",
    };

    // Dane z backendu
    if (savedProfile) {
      const merged: UserFormValues = {
        name: savedProfile.name ?? byAuth0.name,
        surename: savedProfile.surename ?? byAuth0.surename,
        phoneNum: savedProfile.phoneNum ?? "",
        email: savedProfile.email ?? byAuth0.email,
        city: savedProfile.city ?? "",
        profileSummary: savedProfile.profileSummary ?? "",
      };

      setInitialValues(merged);
      setLocked({
        name: Boolean(savedProfile.name),
        surename: Boolean(savedProfile.surename),
        email: Boolean(savedProfile.email),
      });
    } else {
      setInitialValues(byAuth0);
      setLocked({ name: false, surename: false, email: false });
    }

    setLoading(false);
  }, [user, savedProfile]);

  const handleSubmit = async (
    values: UserFormValues,
    helpers: FormikHelpers<UserFormValues>
  ) => {
    const { setSubmitting } = helpers;

    try {
      setSubmitting(true);

      const payload = {
        email: values.email,
        phoneNumber: values.phoneNum,
        name: values.name,
        surname: values.surename,
        city: values.city,
        profileSummary: values.profileSummary,
        abilities: [],
        certificates: [],
        education: [],
        links: [],
        workExperience: [],
        languages: [],
      };

      console.log("[UserForm] SENDING PAYLOAD:", payload);

      const res = await fetch("/api/user/create", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("[UserForm] fetch returned status", res.status);

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `Server returned ${res.status}`);
      }

      const data = await res.json();
      console.log("[UserForm] SUCCESS:", data);

      // Blokujemy już zapisane wartości
      setLocked({
        name: true,
        surename: true,
        email: true,
      });

      alert("Dane zapisane pomyślnie.");
    } catch (err: any) {
      console.error("Submit error:", err);
      alert("Wystąpił błąd podczas zapisu: " + (err?.message ?? "unknown"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-muted">
        Ładowanie formularza...
      </div>
    );
  }



  return (
    <div className="max-w-2xl mx-auto p-6 bg-card_background border border-card_border rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">Edycja profilu</h2>

      <Formik
        initialValues={initialValues}
        enableReinitialize={true}
        validationSchema={userValidator}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-5">
            {/* Imię */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                Imię
              </label>
              <Field
                id="name"
                name="name"
                placeholder="Jan"
                aria-label="Imię"
                readOnly={locked.name}
                className={`w-full p-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                  locked.name ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />
              <ErrorMessage name="name" component="p" className="mt-1 text-sm text-error" />
            </div>

            {/* Nazwisko */}
            <div>
              <label htmlFor="surename" className="block text-sm font-medium text-foreground mb-1">
                Nazwisko
              </label>
              <Field
                id="surename"
                name="surename"
                placeholder="Kowalski"
                aria-label="Nazwisko"
                readOnly={locked.surename}
                className={`w-full p-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                  locked.surename ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />
              <ErrorMessage name="surename" component="p" className="mt-1 text-sm text-error" />
            </div>

            {/* Telefon */}
            <div>
              <label htmlFor="phoneNum" className="block text-sm font-medium text-foreground mb-1">
                Numer telefonu
              </label>
              <Field
                id="phoneNum"
                name="phoneNum"
                placeholder="+48 600 000 000"
                aria-label="Numer telefonu"
                className="w-full p-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <ErrorMessage name="phoneNum" component="p" className="mt-1 text-sm text-error" />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <Field
                id="email"
                name="email"
                type="email"
                placeholder="email@przyklad.pl"
                aria-label="Email"
                readOnly={locked.email}
                className={`w-full p-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                  locked.email ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />
              <ErrorMessage name="email" component="p" className="mt-1 text-sm text-error" />
            </div>

            {/* Miasto */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-foreground mb-1">
                Miasto
              </label>
              <Field
                id="city"
                name="city"
                placeholder="Warszawa"
                aria-label="Miasto"
                className="w-full p-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <ErrorMessage name="city" component="p" className="mt-1 text-sm text-error" />
            </div>

            {/* Podsumowanie */}
            <div>
              <label htmlFor="profileSummary" className="block text-sm font-medium text-foreground mb-1">
                Krótki opis / podsumowanie
              </label>
              <Field
                as="textarea"
                id="profileSummary"
                name="profileSummary"
                rows={5}
                className="w-full p-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-vertical"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-primary hover:bg-primary_hover text-white rounded-lg font-semibold transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? "Zapisuję..." : "Zapisz"}
              </button>

              <button
                type="reset"
                className="px-6 py-3 bg-secondary border border-border text-foreground hover:bg-border rounded-lg font-medium transition-colors duration-200 cursor-pointer"
              >
                Resetuj
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );

}
