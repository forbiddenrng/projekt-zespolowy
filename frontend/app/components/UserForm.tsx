"use client";

import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import type { FormikHelpers } from "formik";
import * as Yup from "yup";

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
  const initialUserValues: UserFormValues = {
    name: "",
    surename: "",
    phoneNum: "",
    email: "",
    city: "",
    profileSummary: "",
  };

  const [initialValues, setInitialValues] =
    useState<UserFormValues>(initialUserValues);
  const [locked, setLocked] = useState({
    name: false,
    surename: false,
    email: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const byAuth0: UserFormValues = {
      name: user?.given_name ?? user?.name ?? "",
      surename: user?.family_name ?? "",
      phoneNum: "",
      email: user?.email ?? "",
      city: "",
      profileSummary: "",
    };

    if (savedProfile) {
      const dbVals: UserFormValues = {
        name: savedProfile.name ?? byAuth0.name,
        surename: savedProfile.surename ?? byAuth0.surename,
        phoneNum: savedProfile.phoneNum ?? "",
        email: savedProfile.email ?? byAuth0.email,
        city: savedProfile.city ?? "",
        profileSummary: savedProfile.profileSummary ?? "",
      };
      setInitialValues(dbVals);
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

      // DEBUG: czy funkcja w ogóle się wywołuje i co jest wysyłane
      console.log("[UserForm] about to fetch /api/user/create", {
        payload,
      });

      const res = await fetch("/api/user/create", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      console.log("[UserForm] fetch returned status", res.status);

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Server returned ${res.status}`);
      }

      const data = await res.json();
      console.log("[UserForm] User service response:", data);

      setLocked({
        name: Boolean(values.name),
        surename: Boolean(values.surename),
        email: Boolean(values.email),
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
    return <div>Ładowanie formularza...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Edycja profilu</h2>

      <Formik
        initialValues={initialValues}
        enableReinitialize={true}
        validationSchema={userValidator}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4">
            {/* Imię */}
            <div>
              <label htmlFor="name">Imię</label>
              <Field
                id="name"
                name="name"
                placeholder="Jan"
                aria-label="Imię"
                readOnly={locked.name}
                className={`w-full p-2 border rounded ${
                  locked.name ? "opacity-60" : ""
                }`}
              />
              <ErrorMessage name="name" component="p" className="text-error" />
            </div>

            {/* Nazwisko */}
            <div>
              <label htmlFor="surename">Nazwisko</label>
              <Field
                id="surename"
                name="surename"
                placeholder="Kowalski"
                aria-label="Nazwisko"
                readOnly={locked.surename}
                className={`w-full p-2 border rounded ${
                  locked.surename ? "opacity-60" : ""
                }`}
              />
              <ErrorMessage
                name="surename"
                component="p"
                className="text-error"
              />
            </div>

            {/* Numer telefonu */}
            <div>
              <label htmlFor="phoneNum">Numer telefonu</label>
              <Field
                id="phoneNum"
                name="phoneNum"
                placeholder="+48 600 000 000"
                aria-label="Numer telefonu"
                className="w-full p-2 border rounded"
              />
              <ErrorMessage
                name="phoneNum"
                component="p"
                className="text-error"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email">Email</label>
              <Field
                id="email"
                name="email"
                type="email"
                placeholder="email@przyklad.pl"
                aria-label="Email"
                readOnly={locked.email}
                className={`w-full p-2 border rounded ${
                  locked.email ? "opacity-60" : ""
                }`}
              />
              <ErrorMessage name="email" component="p" className="text-error" />
            </div>

            {/* Miasto */}
            <div>
              <label htmlFor="city">Miasto</label>
              <Field
                id="city"
                name="city"
                placeholder="Warszawa"
                aria-label="Miasto"
                className="w-full p-2 border rounded"
              />
              <ErrorMessage name="city" component="p" className="text-error" />
            </div>

            {/* Krótkie podsumowanie profilu */}
            <div>
              <label htmlFor="profileSummary">Krótki opis / podsumowanie</label>
              <Field
                as="textarea"
                id="profileSummary"
                name="profileSummary"
                placeholder="Napisz coś o sobie (opcjonalnie)..."
                rows={5}
                className="w-full p-2 border rounded resize-vertical"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary text-white rounded"
              >
                {isSubmitting ? "Zapisuję..." : "Zapisz"}
              </button>

              <button type="reset" className="px-4 py-2 border rounded">
                Resetuj
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
