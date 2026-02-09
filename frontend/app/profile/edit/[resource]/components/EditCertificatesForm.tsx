"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import type { FormikHelpers } from "formik";
import { useRouter } from "next/navigation";
import { FaTrash } from "react-icons/fa";
import {
  emptyCertificates,
  certificatesFormValidator,
  formatDateForInput,
} from "@/app/profile/create/components/UserCertificates";
import CancelButton from "./ui/CancelButton";
import SaveButton from "./ui/SaveButton";
import AddPosition from "./ui/AddPosition";
import type { Certificate } from "@/app/ts/types";

interface EditCertificate {
  id?: number;
  name: string;
  issuer: string;
  certificationDate: string; //ISO format
}

interface EditCertificatesFormValues {
  certificates: EditCertificate[];
}

export default function EditCertificatesForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<EditCertificatesFormValues>({
    certificates: [],
  });

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/user/get?resource=certificates");
        const data = response.data?.data;

        if (data?.certificates && data.certificates.length > 0) {
          const normalizedCertificates = data.certificates.map(
            (cert: {
              id?: number;
              name: string;
              issuer: string;
              certification_date: string;
            }) => ({
              id: cert.id,
              name: cert.name,
              issuer: cert.issuer,
              certificationDate: formatDateForInput(cert.certification_date),
            }),
          );

          setFormData({
            certificates: normalizedCertificates,
          });
        } else {
          setFormData({
            certificates: [],
          });
        }
      } catch (err: any) {
        setError("Error loading data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (
    values: EditCertificatesFormValues,
    helpers: FormikHelpers<EditCertificatesFormValues>,
  ) => {
    const { setSubmitting } = helpers;

    try {
      setSubmitting(true);
      setError(null);

      // Filter out empty entries
      const nonEmpty = (cert: Certificate) =>
        (cert.name && cert.name.trim() !== "") ||
        (cert.issuer && cert.issuer.trim() !== "") ||
        (cert.certificationDate && cert.certificationDate.trim() !== "");

      const payload = values.certificates.filter(nonEmpty).map((cert) => {
        let isoDate = "";
        if (cert.certificationDate) {
          const d = new Date(cert.certificationDate);
          if (!isNaN(d.getTime())) {
            isoDate = d.toISOString();
          }
        }

        return {
          id: cert.id,
          name: cert.name?.trim() ?? "",
          issuer: cert.issuer?.trim() ?? "",
          certificationDate: isoDate,
        };
      });

      const res = await axios.put(
        "/api/user/profile?resource=certificates",
        {
          certificates: payload,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (res.data?.statusCode !== 200) throw new Error("Error saving data");

      setSuccessMessage("Certificates updated successfully!");

      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    } catch (err: any) {
      setError("An error occurred while saving data");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-card-background border border-card-border rounded-lg shadow-lg">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card-background border border-card-border rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">
        Edit Certificates
      </h2>
      <p className="text-muted mb-6">
        Update your certificates. You can add, edit, or remove multiple entries.
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
                      No certificates added yet. You can add them by clicking
                      the button below.
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
                        {values.certificates.length > 0 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-error/10 hover:bg-error/20 text-error transition-colors cursor-pointer duration-200"
                            title="Remove certificate"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>

                      {/* Certificate Name */}
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

                      {/* Issuer */}
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

                      {/* Date of Issue */}
                      <div>
                        <label
                          htmlFor={`certificates.${index}.certificationDate`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Date of Issue
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

                  <AddPosition
                    onClick={() => push({ ...emptyCertificates })}
                    prompt="Add another certificate"
                  />

                  {typeof errors.certificates === "string" && (
                    <p className="text-sm text-error">{errors.certificates}</p>
                  )}
                </div>
              )}
            </FieldArray>

            <div className="flex justify-between gap-4 pt-6 border-t border-border">
              <CancelButton onClick={() => router.back()} />
              <SaveButton isSubmitting={isSubmitting} />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
