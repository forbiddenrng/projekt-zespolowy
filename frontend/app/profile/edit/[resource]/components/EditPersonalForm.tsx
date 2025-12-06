"use client";

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { UserFormValues } from "@/app/ts/types";
import type { FormikHelpers } from "formik";
import { userValidator } from "@/app/profile/create/components/UserForm";
import { useRouter } from "next/navigation";
import CancelButton from "./ui/CancelButton";
import SaveButton from "./ui/SaveButton";

interface EditPersonalFormProps {
  onSuccess?: () => void;
}

const emptyFormValues: UserFormValues = {
  name: "",
  surname: "",
  phoneNum: "",
  email: "",
  city: "",
  profileSummary: "",
};

export default function EditPersonalForm({
  onSuccess,
}: EditPersonalFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserFormValues>(emptyFormValues);

  // Wczytaj dane z API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("/api/user/get");
        if (res.data?.statusCode !== 200) throw new Error("Nie udało się pobrać danych");

        // const json = await res.json();
        const data = res.data?.data;

        if (data) {
          setFormData({
            name: data.name || "",
            surname: data.surname || "",
            phoneNum: data.phone_number || "",
            email: data.email || "",
            city: data.city || "",
            profileSummary: data.profile_summary || "",
          });
        }
      } catch (err: any) {
        setError(err?.message || "Błąd podczas wczytywania danych");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (
    values: UserFormValues,
    helpers: FormikHelpers<UserFormValues>
  ) => {
    const { setSubmitting } = helpers;

    try {
      setSubmitting(true);
      setError(null);

      const res = await axios.patch("/api/user/profile?resource=personal", {
        name: values.name,
        surname: values.surname,
        phoneNumber: values.phoneNum,
        city: values.city,
        profileSummary: values.profileSummary || null
      }, {
        headers: {
          "Content-Type": "application/json"
        }
      })

      if (res.data?.statusCode !== 200) throw new Error("Błąd podczas zapisywania danych");

      setSuccessMessage("Dane zostały pomyślnie zaktualizowane!");

      // Przekieruj po 1.5 sekund
      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    } catch (err: any) {
      setError("Błąd podczas zapisywania danych");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-card-background border border-card-border rounded-lg shadow-lg">
        <p className="text-muted">Ładowanie...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card-background border border-card-border rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">
        Edytuj dane osobowe
      </h2>
      <p className="text-muted mb-6">
        Zmień swoje informacje osobowe.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error text-error rounded-lg">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-success/10 border border-success text-success rounded-lg">
          {successMessage}
        </div>
      )}

      <Formik
        initialValues={formData}
        enableReinitialize={true}
        validationSchema={userValidator}
        validateOnChange={false}
        validateOnBlur={false}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, resetForm }) => (
          <Form className="space-y-5">
            {/* Imię */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Imię
              </label>
              <Field
                id="name"
                name="name"
                placeholder="Jan"
                aria-label="Imię"
                className="w-full p-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <ErrorMessage
                name="name"
                component="p"
                className="mt-1 text-sm text-error"
              />
            </div>

            {/* Nazwisko */}
            <div>
              <label
                htmlFor="surname"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Nazwisko
              </label>
              <Field
                id="surname"
                name="surname"
                placeholder="Kowalski"
                aria-label="Nazwisko"
                className="w-full p-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <ErrorMessage
                name="surname"
                component="p"
                className="mt-1 text-sm text-error"
              />
            </div>

            {/* Telefon */}
            <div>
              <label
                htmlFor="phoneNum"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Numer telefonu
              </label>
              <Field
                id="phoneNum"
                name="phoneNum"
                placeholder="+48 600 000 000"
                aria-label="Numer telefonu"
                className="w-full p-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <ErrorMessage
                name="phoneNum"
                component="p"
                className="mt-1 text-sm text-error"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Email
              </label>
              <Field
                id="email"
                name="email"
                type="email"
                disabled={true}
                placeholder="email@przyklad.pl"
                aria-label="Email"
                className="w-full p-3 bg-secondary border border-border rounded-lg text-muted placeholder:text-muted focus:outline-none focus:ring-2 cursor-not-allowed focus:ring-primary focus:border-transparent transition-all"
              />
              <ErrorMessage
                name="email"
                component="p"
                className="mt-1 text-sm text-error"
              />
            </div>

            {/* Miasto */}
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Miasto
              </label>
              <Field
                id="city"
                name="city"
                placeholder="Warszawa"
                aria-label="Miasto"
                className="w-full p-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <ErrorMessage
                name="city"
                component="p"
                className="mt-1 text-sm text-error"
              />
            </div>

            {/* Podsumowanie */}
            <div>
              <label
                htmlFor="profileSummary"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Krótki opis / podsumowanie
              </label>
              <Field
                as="textarea"
                id="profileSummary"
                name="profileSummary"
                rows={5}
                className="w-full p-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-vertical"
              />
              <ErrorMessage
                name="profileSummary"
                component="p"
                className="mt-1 text-sm text-error"
              />
            </div>

            <div className="flex gap-4 justify-between pt-4">
              <CancelButton
                onClick={() => router.back()}
              />
              <SaveButton
                isSubmitting={isSubmitting}
              />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}