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
import { useWizard } from "../context/WizardContext";

interface UserLanguagesFormProps {
  onBack: () => void;
  onNext: () => void;
  allLanguages: Language[];
}

export const emptyUserLanguage = (): UserLanguage => ({
  id: undefined,
  languageId: null,
  level: LanguageLevel.A1,
});

const languageSchema = Yup.object({
  languageId: Yup.number().nullable().required("Please select a language"),
  level: Yup.mixed<LanguageLevel>().required("Please select a level"),
});

export const languagesFormValidator = Yup.object({
  languages: Yup.array()
    .of(languageSchema)
    .min(1, "Add at least one language")
    .test(
      "unique-languageId",
      "You cannot select the same language more than once.",
      (languages) => {
        if (!languages) return true;
        const ids = languages
          .map((lang) => lang.languageId)
          .filter((id) => id !== null && id !== undefined);
        return new Set(ids).size === ids.length;
      },
    ),
});

export default function UserLanguages({
  onBack,
  onNext,
  allLanguages,
}: UserLanguagesFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { updateLanguages, wizardData } = useWizard();

  const initialValues: UserLanguagesFormValues = {
    languages:
      wizardData.languages.length > 0
        ? wizardData.languages
        : [{ ...emptyUserLanguage() }],
  };

  const handleSubmit = (
    values: UserLanguagesFormValues,
    helpers: FormikHelpers<UserLanguagesFormValues>,
  ) => {
    const { setSubmitting } = helpers;

    updateLanguages(values.languages);
    onNext();
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card_background border border-card_border rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">Languages</h2>
      <p className="text-muted mb-4">
        Add the languages you know. You can add several entries and set your
        proficiency level for each.
      </p>

      {loading && (
        <p className="text-sm text-muted mb-4">Loading languages...</p>
      )}
      {error && <p className="text-sm text-error mb-4">{error}</p>}

      <Formik
        initialValues={initialValues}
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
                            Language #{index + 1}
                          </h3>
                          {values.languages.length > 1 && (
                            <DeleteButton
                              prompt="Remove language"
                              remove={() => remove(index)}
                            />
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* LANGUAGE SELECT */}
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              Language
                            </label>

                            <Field
                              as="select"
                              name={`languages.${index}.languageId`}
                              value={selectedId ?? ""}
                              onChange={(
                                e: React.ChangeEvent<HTMLSelectElement>,
                              ) => {
                                const val = e.target.value;
                                setFieldValue(
                                  `languages.${index}.languageId`,
                                  val === "" ? null : Number(val),
                                );
                              }}
                              className="w-full p-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                            >
                              <option value="">-- select language --</option>
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
                              Proficiency Level
                            </label>

                            <Field
                              as="select"
                              name={`languages.${index}.level`}
                              className="w-full p-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
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
                    Add another language
                  </button>

                  {typeof errors.languages === "string" && (
                    <p className="text-sm text-error">{errors.languages}</p>
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
