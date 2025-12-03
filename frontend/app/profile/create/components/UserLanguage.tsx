"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import type { FormikHelpers } from "formik";
import * as Yup from "yup";
import type {
  Language,
  UserLanguage,
  UserLanguagesFormValues,
} from "@/app/ts/types";
import { LanguageLevel } from "@/app/ts/types";
import BackButton from "./BackButton";
import NextButton from "./NextButton";
import DeleteButton from "./DeleteButton";

interface UserLanguagesFormProps {
  initialLanguages?: UserLanguage[];
  onBack: () => void;
  onNext: (languages: UserLanguage[]) => void;
  fetchUrl?: string;
}

const emptyUserLanguage = (): UserLanguage => ({
  id: undefined,
  languageId: null,
  level: LanguageLevel.A1,
});

const languageSchema = Yup.object({
  languageId: Yup.number().nullable().required("Wybierz język"),
  level: Yup.mixed<LanguageLevel>().required("Wybierz poziom"),
});

const languagesFormValidator = Yup.object({
  languages: Yup.array()
    .of(languageSchema)
    .min(1, "Dodaj co najmniej jeden język")
    .test(
      "unique-languageId",
      "Nie możesz wybrać tego samego języka więcej niż raz.",
      (languages) => {
        if (!languages) return true;
        const ids = languages
          .map((lang) => lang.languageId)
          .filter((id) => id !== null && id !== undefined);
        return new Set(ids).size === ids.length;
      }
    ),
});

export default function UserLanguages({
  initialLanguages = [],
  onBack,
  onNext,
  fetchUrl = "/api/user/language/get",
}: UserLanguagesFormProps) {
  const [allLanguages, setAllLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    fetch(fetchUrl)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
        const json = await res.json();
        const data = json?.data ?? [];
        if (!Array.isArray(data)) throw new Error("Invalid data format");

        if (mounted) setAllLanguages(data);
      })
      .catch(() => {
        if (mounted) setError("Nie udało się pobrać listy języków.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [fetchUrl]);

  // const filteredLanguages = useMemo(() => {
  //   const q = searchQuery.trim().toLowerCase();
  //   if (!q) return allLanguages;
  //   return allLanguages.filter(
  //     (l) =>
  //       l.name.toLowerCase().includes(q) ||
  //       (l.code ?? "").toLowerCase().includes(q)
  //   );
  // }, [allLanguages, searchQuery]);

  const handleSubmit = (
    values: UserLanguagesFormValues,
    helpers: FormikHelpers<UserLanguagesFormValues>
  ) => {
    const { setSubmitting } = helpers;
    onNext(values.languages);
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card_background border border-card_border rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">Języki</h2>
      <p className="text-muted mb-4">
        Dodaj języki, które znasz. Możesz dodać kilka pozycji i ustawić poziom
        znajomości.
      </p>

      {/* <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">
          Szukaj języka
        </label>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="wyszukaj po nazwie lub kodzie (np. en, pl)"
          className="w-full p-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all"
        />
      </div> */}

      {loading && (
        <p className="text-sm text-muted mb-4">Ładowanie języków...</p>
      )}
      {error && <p className="text-sm text-error mb-4">{error}</p>}

      <Formik
        initialValues={{
          languages:
            initialLanguages.length > 0
              ? initialLanguages
              : [{ ...emptyUserLanguage() }],
        }}
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
                  {values.languages.map((lang, index) => {
                    const selectedId = lang.languageId;

                    return (
                      <div
                        key={index}
                        className="p-5 bg-secondary border border-border rounded-lg space-y-4 relative"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium text-foreground">
                            Język #{index + 1}
                          </h3>
                          {values.languages.length > 1 && (
                            <DeleteButton
                              prompt="Usuń język"
                              remove={() => remove(index)}
                            />
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* LANGUAGE SELECT */}
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              Język
                            </label>

                            <Field
                              as="select"
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
                              className="w-full p-3 bg-background border border-border rounded-lg"
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
                            <label className="block text-sm font-medium text-foreground mb-1">
                              Poziom znajomości
                            </label>

                            <Field
                              as="select"
                              name={`languages.${index}.level`}
                              className="w-full p-3 bg-background border border-border rounded-lg"
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

                  <button
                    type="button"
                    onClick={() => push({ ...emptyUserLanguage() })}
                    className="w-full p-3 border-2 border-dashed border-border rounded-lg text-muted hover:text-foreground hover:border-primary transition-all"
                  >
                    ➕ Dodaj kolejny język
                  </button>

                  {typeof errors.languages === "string" && (
                    <p className="text-sm text-error">{errors.languages}</p>
                  )}
                </div>
              )}
            </FieldArray>

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
