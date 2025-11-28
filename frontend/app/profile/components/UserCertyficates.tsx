"use client";

import React from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import type { FormikHelpers } from "formik";
import * as Yup from "yup";
import type { Certyficates, CertyficatesFormValues } from "@/app/ts/types";
import BackButton from "./BackButton";
import NextButton from "./NextButton";

interface CertyficatesFormProps {
  initialCertyficates?: Certyficates[];
  onBack: () => void;
  onNext: (certyficates: Certyficates[]) => void;
}

const emptyCertyficates: Certyficates = {
  name: "",
  issuer: "",
  certyficationDate: "",
};

/**
 * Schema akceptuje puste pola — pola nie są wymagane.
 * Data dopuszcza puste stringi/undefined, ale jeśli jest wartością,
 * to sprawdzamy czy jest poprawną datą.
 */
const certyficatesSchema = Yup.object({
  name: Yup.string().nullable(),
  issuer: Yup.string().nullable(),
  certyficationDate: Yup.string()
    .nullable()
    .test("is-valid-date-or-empty", "Niepoprawny format daty", (value) => {
      if (!value) return true; // puste pole jest OK
      const d = new Date(value);
      return !isNaN(d.getTime());
    }),
});

/**
 * Tablica certyfikatów nie jest już wymagana (użytkownik może pozostawić pustą)
 */
const certyficatesFormValidator = Yup.object({
  certyficates: Yup.array().of(certyficatesSchema),
});

const formatDateForInput = (dateString: string | undefined): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

export default function CertyficatesForm({
  initialCertyficates = [],
  onBack,
  onNext,
}: CertyficatesFormProps) {
  // Normalizuj wejściowe certyfikaty: zapewnij puste stringi i sformatuj daty
  const normalizedCertyfication: Certyficates[] =
    initialCertyficates?.length > 0
      ? initialCertyficates.map((cert) => ({
          name: cert?.name ?? "",
          issuer: cert?.issuer ?? "",
          certyficationDate: formatDateForInput(cert?.certyficationDate),
        }))
      : [];

  const initialValues: CertyficatesFormValues = {
    // jeśli brak zapisanych certyfikatów, zostaw tablicę pustą (użytkownik nie musi nic dodawać)
    certyficates:
      normalizedCertyfication.length > 0 ? normalizedCertyfication : [],
  };

  const handleSubmit = (
    values: CertyficatesFormValues,
    helpers: FormikHelpers<CertyficatesFormValues>
  ) => {
    const { setSubmitting } = helpers;

    // Filtrujemy puste wpisy (wszystkie pola puste) — nie wysyłamy ich dalej
    const nonEmpty = (cert: Certyficates) =>
      (cert.name && cert.name.trim() !== "") ||
      (cert.issuer && cert.issuer.trim() !== "") ||
      (cert.certyficationDate && cert.certyficationDate.trim() !== "");

    const formattedCertyfication: Certyficates[] = values.certyficates
      .filter(nonEmpty)
      .map((cert) => {
        // konwertuj datę tylko jeśli jest poprawna; w przeciwnym razie zostaw pusty string
        let isoDate = "";
        if (cert.certyficationDate) {
          const d = new Date(cert.certyficationDate);
          if (!isNaN(d.getTime())) {
            isoDate = d.toISOString();
          } else {
            isoDate = "";
          }
        }

        return {
          name: cert.name?.trim() ?? "",
          issuer: cert.issuer?.trim() ?? "",
          certyficationDate: isoDate,
        };
      });

    onNext(formattedCertyfication);
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card_background border border-card_border rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">
        Certyfikaty
      </h2>
      <p className="text-muted mb-6">
        Dodaj informacje o swoich certyfikatach (opcjonalne). Jeśli nie masz —
        po prostu przejdź dalej.
      </p>

      <Formik
        initialValues={initialValues}
        enableReinitialize={true}
        validationSchema={certyficatesFormValidator}
        validateOnChange={false}
        validateOnBlur={false}
        onSubmit={handleSubmit}
      >
        {({ values, isSubmitting, errors }) => (
          <Form className="space-y-6">
            <FieldArray name="certyficates">
              {({ push, remove }) => (
                <div className="space-y-6">
                  {values.certyficates.length === 0 && (
                    <div className="p-4 bg-secondary border border-border rounded-lg text-sm text-muted">
                      Nie dodałeś żadnych certyfikatów. Możesz dodać je klikając
                      przycisk poniżej lub przejść dalej.
                    </div>
                  )}

                  {values.certyficates.map((_, index) => (
                    <div
                      key={index}
                      className="p-5 bg-secondary border border-border rounded-lg space-y-4 relative"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-foreground">
                          Certyfikat #{index + 1}
                        </h3>
                        {values.certyficates.length > 0 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-error hover:text-red-400 transition-colors p-1"
                            aria-label="Usuń certyfikat"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Nazwa certyfikatu */}
                      <div>
                        <label
                          htmlFor={`certyficates.${index}.name`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Nazwa certyfikatu
                        </label>
                        <Field
                          id={`certyficates.${index}.name`}
                          name={`certyficates.${index}.name`}
                          placeholder="np. AWS Certified Developer"
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <ErrorMessage
                          name={`certyficates.${index}.name`}
                          component="p"
                          className="mt-1 text-sm text-error"
                        />
                      </div>

                      {/* Wydawca */}
                      <div>
                        <label
                          htmlFor={`certyficates.${index}.issuer`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Wydawca
                        </label>
                        <Field
                          id={`certyficates.${index}.issuer`}
                          name={`certyficates.${index}.issuer`}
                          placeholder="np. Amazon Web Services"
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <ErrorMessage
                          name={`certyficates.${index}.issuer`}
                          component="p"
                          className="mt-1 text-sm text-error"
                        />
                      </div>

                      {/* Data otrzymania */}
                      <div>
                        <label
                          htmlFor={`certyficates.${index}.certyficationDate`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Data otrzymania (opcjonalne)
                        </label>
                        <Field
                          type="date"
                          id={`certyficates.${index}.certyficationDate`}
                          name={`certyficates.${index}.certyficationDate`}
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <ErrorMessage
                          name={`certyficates.${index}.certyficationDate`}
                          component="p"
                          className="mt-1 text-sm text-error"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Przycisk dodawania */}
                  <button
                    type="button"
                    onClick={() => push({ ...emptyCertyficates })}
                    className="w-full p-3 border-2 border-dashed border-border rounded-lg text-muted hover:text-foreground hover:border-primary transition-all flex items-center justify-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Dodaj kolejny certyfikat
                  </button>

                  {/* Błąd walidacji tablicy */}
                  {typeof errors.certyficates === "string" && (
                    <p className="text-sm text-error">{errors.certyficates}</p>
                  )}
                </div>
              )}
            </FieldArray>

            {/* Przyciski nawigacji */}
            <div className="flex justify-between gap-4 pt-6 border-t border-border">
              <BackButton prompt={"Wstecz"} onBack={onBack} />

              <NextButton prompt={"Dalej"} isSubmitting={isSubmitting} />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
