"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import type { FormikHelpers } from "formik";
import { useRouter } from "next/navigation";
import { FaTrash } from "react-icons/fa";
import {
  emptyLinks,
  linksFormValidator,
} from "@/app/profile/create/components/UserLink";
import CancelButton from "./ui/CancelButton";
import SaveButton from "./ui/SaveButton";
import AddPosition from "./ui/AddPosition";

interface EditLink{
  id?: number;
  linkString: string;
}

interface EditLinksFormValues {
  links: EditLink[];
}

export default function EditLinksForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<EditLinksFormValues>({
    links: [],
  });

  // Wczytaj dane z API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/user/get?resource=links");
        const data = response.data?.data;

        if (data?.links && data.links.length > 0) {
          const normalizedLinks = data.links.map(
            (link: {
              id?: number;
              linkString: string;
            }) => ({
              id: link.id,
              linkString: link.linkString,
            })
          );

          setFormData({
            links: normalizedLinks,
          });
        } else {
          setFormData({
            links: [],
          });
        }
      } catch (err: any) {
        setError("Błąd podczas wczytywania danych");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (
    values: EditLinksFormValues,
    helpers: FormikHelpers<EditLinksFormValues>
  ) => {
    const { setSubmitting } = helpers;

    try {
      setSubmitting(true);
      setError(null);

      const payload = values.links.map((link) => ({
        id: link.id,
        linkString: link.linkString,
      }));

      const res = await axios.put("/api/user/profile?resource=links", {
        links: payload,
      }, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.data?.statusCode !== 200)
        throw new Error("Błąd podczas zapisywania danych");

      setSuccessMessage("Linki zostały pomyślnie zaktualizowane!");

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
        Edytuj linki
      </h2>
      <p className="text-muted mb-6">
        Zmień swoje linki (np. LinkedIn, GitHub). Możesz dodać lub usunąć wiele
        pozycji.
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
        validationSchema={linksFormValidator}
        validateOnChange={false}
        validateOnBlur={false}
        onSubmit={handleSubmit}
      >
        {({ values, isSubmitting, errors }) => (
          <Form className="space-y-6">
            <FieldArray name="links">
              {({ push, remove }) => (
                <div className="space-y-6">
                  {values.links.length === 0 && (
                    <div className="p-4 bg-secondary border border-border rounded-lg text-sm text-muted">
                      Nie dodałeś żadnych linków. Możesz dodać je klikając
                      przycisk poniżej.
                    </div>
                  )}

                  {values.links.map((_, index) => (
                    <div
                      key={index}
                      className="p-5 bg-secondary border border-border rounded-lg space-y-4 relative"
                    >
                      {/* Nagłówek karty */}
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-foreground">
                          Link #{index + 1}
                        </h3>
                        {values.links.length > 0 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-error/10 hover:bg-error/20 text-error transition-colors cursor-pointer duration-200"
                            title="Usuń link"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>

                      {/* Link */}
                      <div>
                        <label
                          htmlFor={`links.${index}.linkString`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Link
                        </label>
                        <Field
                          id={`links.${index}.linkString`}
                          name={`links.${index}.linkString`}
                          placeholder="np. https://github.com/twoj-uzytkownik"
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <ErrorMessage
                          name={`links.${index}.linkString`}
                          component="p"
                          className="mt-1 text-sm text-error"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Przycisk dodawania */}
                  <AddPosition
                    onClick={() => push({ ...emptyLinks })}
                    prompt="Dodaj kolejny link"
                  />

                  {/* Błąd walidacji tablicy */}
                  {typeof errors.links === "string" && (
                    <p className="text-sm text-error">{errors.links}</p>
                  )}
                </div>
              )}
            </FieldArray>

            {/* Przyciski nawigacji */}
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