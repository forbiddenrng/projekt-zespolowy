"use client";

import React from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import type { FormikHelpers } from "formik";
import * as Yup from "yup";
import type { Links, LinksFormValues } from "@/app/ts/types";
import BackButton from "./BackButton";
import NextButton from "./NextButton";

interface LinksFormProps {
  initialLinks?: Links[];
  onBack: () => void;
  onNext: (links: Links[]) => void;
}

const emptyLinks: Links = {
  linkString: "",
};

const linksSchema = Yup.object({
  linkString: Yup.string().required("Link jest wymagany"),
});

const linksFormValidator = Yup.object({
  links: Yup.array().of(linksSchema).min(1, "Dodaj co najmniej jeden link"),
});

export default function LinksForm({
  initialLinks = [],
  onBack,
  onNext,
}: LinksFormProps) {
  // Upewnij się, że każdy element ma zawsze property 'link' (nawet jeśli undefined w savedProfile)
  const normalizedInitialLinks: Links[] =
    initialLinks?.length > 0
      ? initialLinks.map((l) => ({ linkString: (l && l.linkString) ?? "" }))
      : [{ ...emptyLinks }];

  const handleSubmit = (
    values: LinksFormValues,
    helpers: FormikHelpers<LinksFormValues>
  ) => {
    const { setSubmitting } = helpers;

    onNext(values.links);
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card_background border border-card_border rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">Linki</h2>
      <p className="text-muted mb-6">
        Dodaj swoje linki (np. LinkedIn, GitHub). Możesz dodać wiele pozycji.
      </p>

      <Formik
        initialValues={{
          links: normalizedInitialLinks,
        }}
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
                  {values.links.map((_, index) => (
                    <div
                      key={index}
                      className="p-5 bg-secondary border border-border rounded-lg space-y-4 relative"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-foreground">
                          Link #{index + 1}
                        </h3>
                        {values.links.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-error hover:text-red-400 transition-colors p-1"
                            aria-label="Usuń link"
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

                  <button
                    type="button"
                    onClick={() => push({ ...emptyLinks })}
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
                    Dodaj kolejny link
                  </button>

                  {typeof errors.links === "string" && (
                    <p className="text-sm text-error">{errors.links}</p>
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
