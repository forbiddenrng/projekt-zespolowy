"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import type { FormikHelpers } from "formik";
import { useRouter } from "next/navigation";
import { FaTrash } from "react-icons/fa";
import {
  emptyUserLanguage,
  languagesFormValidator,
} from "@/app/profile/create/components/UserLanguage";
import CancelButton from "./ui/CancelButton";
import SaveButton from "./ui/SaveButton";
import AddPosition from "./ui/AddPosition";
import type { UserLanguage, Language } from "@/app/ts/types";
import { LanguageLevel } from "@/app/ts/types";

interface EditLanguage {
  id?: number;
  languageId: number;
  level: LanguageLevel
}

interface EditLanguagesFormValues {
  languages: EditLanguage[];
}

export default function EditLanguagesForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [allLanguages, setAllLanguages] = useState<Language[]>([]);
  const [formData, setFormData] = useState<EditLanguagesFormValues>({
    languages: [],
  });

  // Wczytaj dane z API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Wczytaj wszystkie dostępne języki
        const languagesRes = await axios.get("/api/user/language/get");
        const languages = languagesRes.data?.data || [];
        setAllLanguages(languages);

        // Wczytaj języki użytkownika
        const userRes = await axios.get("/api/user/get?resource=languages");
        const userData = userRes.data?.data;

        console.log("----USER-LANGUAGES----")
        console.log(userData.user_languages)

        if (userData?.user_languages && userData.user_languages.length > 0) {
          const normalizedLanguages = userData.user_languages.map(
            (ul: {
              id?: number;
              language: {id: number, name: string, code: string};
              level: LanguageLevel;
            }) => ({
              id: ul.id,
              languageId: ul.language.id,
              level: ul.level, 
            })
          );

          setFormData({
            languages: normalizedLanguages,
          });
        } else {
          setFormData({
            languages: [],
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
    values: EditLanguagesFormValues,
    helpers: FormikHelpers<EditLanguagesFormValues>
  ) => {
    const { setSubmitting } = helpers;

    try {
      setSubmitting(true);
      setError(null);

      const payload = values.languages.map((lang) => ({
        id: lang.id,
        languageId: lang.languageId,
        level: lang.level,
      }));

      console.log("--update-payload--")
      console.log(payload)

      const res = await axios.put("/api/user/profile?resource=languages", {
        languages: payload,
      }, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.data?.statusCode !== 200)
        throw new Error("Błąd podczas zapisywania danych");

      setSuccessMessage("Języki zostały pomyślnie zaktualizowane!");

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
        Edytuj języki
      </h2>
      <p className="text-muted mb-6">
        Zmień języki, które znasz. Możesz dodać, edytować lub usunąć wiele
        pozycji i ustawić poziom znajomości.
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
        validationSchema={languagesFormValidator}
        validateOnChange={false}
        validateOnBlur={false}
        onSubmit={handleSubmit}
      >
        {({ values, isSubmitting, errors, setFieldValue }) => (
          <Form className="space-y-6">
            <FieldArray name="languages">
              {({ push, remove }) => (
                <div className="space-y-6">
                  {values.languages.length === 0 && (
                    <div className="p-4 bg-secondary border border-border rounded-lg text-sm text-muted">
                      Nie dodałeś żadnych języków. Możesz dodać je klikając
                      przycisk poniżej.
                    </div>
                  )}

                  {values.languages.map((lang, index) => {
                    const selectedId = lang.languageId;

                    return (
                      <div
                        key={index}
                        className="p-5 bg-secondary border border-border rounded-lg space-y-4 relative"
                      >
                        {/* Nagłówek karty */}
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium text-foreground">
                            Język #{index + 1}
                          </h3>
                          {values.languages.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-error/10 hover:bg-error/20 text-error transition-colors cursor-pointer duration-200"
                              title="Usuń język"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* LANGUAGE SELECT */}
                          <div>
                            <label
                              htmlFor={`languages.${index}.languageId`}
                              className="block text-sm font-medium text-foreground mb-1"
                            >
                              Język
                            </label>

                            <Field
                              as="select"
                              id={`languages.${index}.languageId`}
                              name={`languages.${index}.languageId`}
                              value={selectedId ?? ""}
                              onChange={(
                                e: React.ChangeEvent<HTMLSelectElement>
                              ) => {
                                const val = e.target.value;
                                setFieldValue(
                                  `languages.${index}.languageId`,
                                  val === "" ? null : Number(val)
                                );
                              }}
                              className="w-full p-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            >
                              <option value="">-- wybierz język --</option>
                              {allLanguages.map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.name} {l.code ? `(${l.code})` : ""}
                                </option>
                              ))}
                            </Field>

                            <ErrorMessage
                              name={`languages.${index}.languageId`}
                              component="p"
                              className="mt-1 text-sm text-error"
                            />
                          </div>

                          {/* LEVEL SELECT */}
                          <div>
                            <label
                              htmlFor={`languages.${index}.level`}
                              className="block text-sm font-medium text-foreground mb-1"
                            >
                              Poziom znajomości
                            </label>

                            <Field
                              as="select"
                              id={`languages.${index}.level`}
                              name={`languages.${index}.level`}
                              className="w-full p-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            >
                              {Object.values(LanguageLevel).map((lvl) => (
                                <option key={lvl} value={lvl}>
                                  {lvl}
                                </option>
                              ))}
                            </Field>

                            <ErrorMessage
                              name={`languages.${index}.level`}
                              component="p"
                              className="mt-1 text-sm text-error"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Przycisk dodawania */}
                  <AddPosition
                    onClick={() => push({ ...emptyUserLanguage() })}
                    prompt="Dodaj kolejny język"
                  />

                  {/* Błąd walidacji tablicy */}
                  {typeof errors.languages === "string" && (
                    <p className="text-sm text-error">{errors.languages}</p>
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