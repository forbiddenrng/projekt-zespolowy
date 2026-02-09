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

export const certificatesSchema = Yup.object({
  name: Yup.string()
    .required("Certificate name is required")
    .min(3, "Certificate name must be at least 3 characters")
    .max(100, "Certificate name cannot exceed 100 characters"),
  issuer: Yup.string()
    .required("Issuer is required")
    .min(3, "Issuer name must be at least 3 characters")
    .max(255, "Issuer name cannot exceed 255 characters"),
  certificationDate: Yup.string()
    .test("is-valid-date-or-empty", "Invalid date format", (value) => {
      if (!value) return false;
      const d = new Date(value);
      return !isNaN(d.getTime());
    })
    .test("is-valid-date", "Date cannot be in the future", (value) => {
      if (!value) return true;
      return new Date(value) <= new Date();
    }),
});

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

export default function CertificatesForm({
  onBack,
  onNext,
}: CertificatesFormProps) {
  const { updateCertificates, wizardData } = useWizard();
  const initialCertificates: CertificatesFormValues = {
    certificates: wizardData.certificates.map((cert) => ({
      ...cert,
      certificationDate: formatDateForInput(cert.certificationDate),
    })),
  };

  const handleSubmit = (
    values: CertificatesFormValues,
    helpers: FormikHelpers<CertificatesFormValues>,
  ) => {
    const { setSubmitting } = helpers;

    const nonEmpty = (cert: Certificate) =>
      (cert.name && cert.name.trim() !== "") ||
      (cert.issuer && cert.issuer.trim() !== "") ||
      (cert.certificationDate && cert.certificationDate.trim() !== "");

    const formattedCertification: Certificate[] = values.certificates
      .filter(nonEmpty)
      .map((cert) => {
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

    updateCertificates(formattedCertification);
    onNext();
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card_background border border-card_border rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">
        Certificates
      </h2>
      <p className="text-muted mb-6">
        Add information about your certifications (optional). If you don't have
        any, simply proceed to the next step.
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
                      You haven't added any certificates yet. You can add them
                      by clicking the button below or just skip this step.
                    </div>
                  )}

                  {values.certificates.map((_, index) => (
                    <div
                      key={index}
                      className="p-5 bg-secondary border border-border rounded-lg space-y-4 relative"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-foreground">
                          Certificate #{index + 1}
                        </h3>
                        <DeleteButton
                          prompt="Remove certificate"
                          remove={() => remove(index)}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`certificates.${index}.name`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Certificate Name
                        </label>
                        <Field
                          id={`certificates.${index}.name`}
                          name={`certificates.${index}.name`}
                          placeholder="e.g. AWS Certified Developer"
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <ErrorMessage
                          name={`certificates.${index}.name`}
                          component="p"
                          className="mt-1 text-sm text-error"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`certificates.${index}.issuer`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Issuer
                        </label>
                        <Field
                          id={`certificates.${index}.issuer`}
                          name={`certificates.${index}.issuer`}
                          placeholder="e.g. Amazon Web Services"
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <ErrorMessage
                          name={`certificates.${index}.issuer`}
                          component="p"
                          className="mt-1 text-sm text-error"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`certificates.${index}.certificationDate`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Issue Date
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
                    Add another certificate
                  </button>

                  {typeof errors.certificates === "string" && (
                    <p className="text-sm text-error">{errors.certificates}</p>
                  )}
                </div>
              )}
            </FieldArray>

            <div className="flex justify-between gap-4 pt-6 border-t border-border">
              <BackButton prompt={"Back"} onBack={onBack} />
              <NextButton prompt={"Next"} isSubmitting={isSubmitting} />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
