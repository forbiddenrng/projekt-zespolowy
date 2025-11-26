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
                disabled={locked.name}
                className="w-full p-2 border rounded"
              />
              <ErrorMessage name="name" component="p" className="text-error" />
            </div>

            {/* Nazwisko */}
            <div>
              <label htmlFor="surename">Nazwisko</label>
              <Field
                id="surename"
                name="surename"
                disabled={locked.surename}
                className="w-full p-2 border rounded"
              />
              <ErrorMessage
                name="surename"
                component="p"
                className="text-error"
              />
            </div>

            {/* Telefon */}
            <div>
              <label htmlFor="phoneNum">Numer telefonu</label>
              <Field
                id="phoneNum"
                name="phoneNum"
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
                disabled={locked.email}
                className="w-full p-2 border rounded"
              />
              <ErrorMessage name="email" component="p" className="text-error" />
            </div>

            {/* Miasto */}
            <div>
              <label htmlFor="city">Miasto</label>
              <Field
                id="city"
                name="city"
                className="w-full p-2 border rounded"
              />
              <ErrorMessage name="city" component="p" className="text-error" />
            </div>

            {/* Podsumowanie */}
            <div>
              <label htmlFor="profileSummary">Krótki opis</label>
              <Field
                as="textarea"
                id="profileSummary"
                name="profileSummary"
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
