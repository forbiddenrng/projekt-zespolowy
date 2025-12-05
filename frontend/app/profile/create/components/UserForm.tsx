"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { UserFormValues, SavedProfile } from "@/app/ts/types";
import type { FormikHelpers } from "formik";
import * as Yup from "yup";
import NextButton from "./NextButton";
import { useWizard } from "../context/WizardContext";

interface UserFormProps {
  user: {
    name?: string;
    email?: string;
    family_name?: string;
    given_name?: string;
    sub: string;
  };
  onNext: () => void;
}

const userValidator = Yup.object({
  name: Yup.string().required("Imię jest wymagane")
  .min(2, "Imię musi mieć co najmniej 2 znaki")
  .max(100, "Imię nie może być dłuższe niż 100 znaków"),
  surname: Yup.string().required("Nazwisko jest wymagane")
  .min(2, "Nazwisko musi mieć co najmniej 2 znaki")
  .max(100, "Nazwisko nie może być dłuższe niż 100 znaków"),
  phoneNum: Yup.string()
    .required("Numer telefonu jest wymagany")
    .min(9, "Numer telefonu musi mieć co najmniej 9 znaków")
    .max(20, "Numer telefonu nie może być dłuższy niż 20 znaków"),
  email: Yup.string()
    .email("Niepoprawny email")
    .required("Email jest wymagany"),
  city: Yup.string().required("Nazwa Miasta jest wymagana")
  .min(2, "Miasto musi mieć co najmniej 2 znaki")
  .max(100, "Miasto nie może być dłuższe niż 100 znaków"),
  profileSummary: Yup.string().optional().min(
    20,
    "Opis profilu musi być dłuższy niż 20 znaków"
  ),
});


const emptyFormValues: UserFormValues  = { 
  name: "",
  surname: "",
  phoneNum:  "",
  email: "",
  city:  "",
  profileSummary: "",
}

/**
 * user - loaded from session
 * savedProfile - fetched from user-service
 * initialValues - values saved from form
 * Form values loading: initialValues (values already saved in form) -> savedProfile -> default values (empty string)
 */
export default function UserForm({
  user,
  onNext,
}: UserFormProps) {
  const {updateUserInfo, wizardData} = useWizard();

  const initialFormValues = useMemo<UserFormValues>(() => {
    return {
      name: wizardData.userInfo?.name || user?.name || user?.given_name || "",
      surname: wizardData.userInfo?.surname || user?.family_name || "",
      phoneNum:  wizardData.userInfo?.phoneNum || "",
      email: wizardData.userInfo?.email || user?.email || "",
      city:  wizardData.userInfo?.city || "",
      profileSummary: wizardData.userInfo?.profileSummary || "",
    };
  }, [user]);

  const handleSubmit = async (
    values: UserFormValues,
    helpers: FormikHelpers<UserFormValues>
  ) => {
    const { setSubmitting } = helpers;

    try {
      setSubmitting(true);
      updateUserInfo(values);
      onNext();

    } catch (err: any) {
      console.error("Submit error:", err);
      alert("Wystąpił błąd podczas zapisu: " + (err?.message ?? "unknown"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card_background border border-card_border rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">
        Dane osobowe
      </h2>
      <p className="text-muted mb-6">
        Dodaj informacje o swoich danych osobowych.
      </p>

      <Formik
        initialValues={initialFormValues}
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
                className={`w-full p-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
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
                className={`w-full p-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
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
                placeholder="email@przyklad.pl"
                aria-label="Email"
                className={`w-full p-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
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
              <button
                type="button"
                onClick={() => resetForm({ values: emptyFormValues })}
                className="px-6 py-3 bg-secondary border border-border text-foreground hover:bg-border rounded-lg font-medium transition-colors duration-200 cursor-pointer"
              >
                Resetuj
              </button>

              <NextButton
                prompt={isSubmitting ? "Zapisuje..." : "Dalej"}
                isSubmitting={isSubmitting}
              />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
