"use client";

import React from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import type { FormikHelpers } from "formik";
import * as Yup from "yup";
import type { Certificate, CertificatesFormValues } from "@/app/ts/types";
import BackButton from "./BackButton";
import NextButton from "./NextButton";
import DeleteButton from "./DeleteButton";
import { useWizard } from "../context/WizardContext";

interface CertificatesFormProps {
  onBack: () => void;
  onNext: () => void;
}

export const emptyCertificates: Certificate = {
  name: "",
  issuer: "",
  certificationDate: "",
};

/**
 * Schema akceptuje puste pola — pola nie są wymagane.
 * Data dopuszcza puste stringi/undefined, ale jeśli jest wartością,
 * to sprawdzamy czy jest poprawną datą.
 */
export const certificatesSchema = Yup.object({
  name: Yup.string().required("Nazwa certyfikatu jest wymagana")
  .min(3, "Nazwa certyfikatu musi mieć co najmniej 3 znaki")
  .max(100, "Nazwa certyfikatu nie może być dłuższa niż 100 znaków"),
  issuer: Yup.string().required("Wydawca certyfikatu jest wymagany")
  .min(3, "Wydawca certyfikatu musi mieć co najmniej 3 znaki")
  .max(255, "Wydawca certyfikatu nie może być dłuższy niż 255 znaków"),
  certificationDate: Yup.string()
    .test("is-valid-date-or-empty", "Niepoprawny format daty", (value) => {
      if (!value) return false; 
      const d = new Date(value);
      return !isNaN(d.getTime());
    })
    .test('is-valid-date', "Data nie może być późniejsza niż dzisiaj", (value) => {
      if (!value) return true;
      return new Date(value) < new Date();
    })
});

/**
 * Tablica certyfikatów nie jest już wymagana (użytkownik może pozostawić pustą)
 */
export const certificatesFormValidator = Yup.object({
  certificates: Yup.array().of(certificatesSchema),
});

export const formatDateForInput = (dateString: string | undefined): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

export default function certificatesForm({
  onBack,
  onNext,
}: CertificatesFormProps) {

  const {updateCertificates, wizardData} = useWizard();
  const initialCertificates: CertificatesFormValues = {
    certificates: wizardData.certificates.map((cert)=> ({
      ...cert,
      certificationDate: formatDateForInput(cert.certificationDate)
    }) )
  }

  const handleSubmit = (
    values: CertificatesFormValues,
    helpers: FormikHelpers<CertificatesFormValues>
  ) => {
    const { setSubmitting } = helpers;

    // Filtrujemy puste wpisy (wszystkie pola puste) — nie wysyłamy ich dalej
    const nonEmpty = (cert: Certificate) =>
      (cert.name && cert.name.trim() !== "") ||
      (cert.issuer && cert.issuer.trim() !== "") ||
      (cert.certificationDate && cert.certificationDate.trim() !== "");

    const formattedCertification: Certificate[] = values.certificates
      .filter(nonEmpty)
      .map((cert) => {
        // konwertuj datę tylko jeśli jest poprawna; w przeciwnym razie zostaw pusty string
        let isoDate = "";
        if (cert.certificationDate) {
          const d = new Date(cert.certificationDate);
          if (!isNaN(d.getTime())) {
            isoDate = d.toISOString();
          } else {
            isoDate = "";
          }
        }

        return {
          name: cert.name?.trim() ?? "",
          issuer: cert.issuer?.trim() ?? "",
          certificationDate: isoDate,
        };
      });

    console.log(formattedCertification)
    updateCertificates(formattedCertification);
    onNext();
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
        initialValues={initialCertificates}
        enableReinitialize={true}
        validationSchema={certificatesFormValidator}
        validateOnChange={false}
        validateOnBlur={false}
        onSubmit={handleSubmit}
      >
        {({ values, isSubmitting, errors }) => (
          <Form className="space-y-6">
            <FieldArray name="certificates">
              {({ push, remove }) => (
                <div className="space-y-6">
                  {values.certificates.length === 0 && (
                    <div className="p-4 bg-secondary border border-border rounded-lg text-sm text-muted">
                      Nie dodałeś żadnych certyfikatów. Możesz dodać je klikając
                      przycisk poniżej lub przejść dalej.
                    </div>
                  )}

                  {values.certificates.map((_, index) => (
                    <div
                      key={index}
                      className="p-5 bg-secondary border border-border rounded-lg space-y-4 relative"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-foreground">
                          Certyfikat #{index + 1}
                        </h3>
                        <DeleteButton
                          prompt="Usuń certyfikat"
                          remove={() => remove(index)}
                        />
                      </div>

                      {/* Nazwa certyfikatu */}
                      <div>
                        <label
                          htmlFor={`certificates.${index}.name`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Nazwa certyfikatu
                        </label>
                        <Field
                          id={`certificates.${index}.name`}
                          name={`certificates.${index}.name`}
                          placeholder="np. AWS Certified Developer"
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <ErrorMessage
                          name={`certificates.${index}.name`}
                          component="p"
                          className="mt-1 text-sm text-error"
                        />
                      </div>

                      {/* Wydawca */}
                      <div>
                        <label
                          htmlFor={`certificates.${index}.issuer`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Wydawca
                        </label>
                        <Field
                          id={`certificates.${index}.issuer`}
                          name={`certificates.${index}.issuer`}
                          placeholder="np. Amazon Web Services"
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <ErrorMessage
                          name={`certificates.${index}.issuer`}
                          component="p"
                          className="mt-1 text-sm text-error"
                        />
                      </div>

                      {/* Data otrzymania */}
                      <div>
                        <label
                          htmlFor={`certificates.${index}.certificationDate`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Data otrzymania
                        </label>
                        <Field
                          type="date"
                          id={`certificates.${index}.certificationDate`}
                          name={`certificates.${index}.certificationDate`}
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <ErrorMessage
                          name={`certificates.${index}.certificationDate`}
                          component="p"
                          className="mt-1 text-sm text-error"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Przycisk dodawania */}
                  <button
                    type="button"
                    onClick={() => push({ ...emptyCertificates })}
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
                  {typeof errors.certificates === "string" && (
                    <p className="text-sm text-error">{errors.certificates}</p>
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
