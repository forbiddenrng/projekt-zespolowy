"use client";

import React from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import type { FormikHelpers } from "formik";
import * as Yup from "yup";
import type { Links, LinksFormValues } from "@/app/ts/types";
import BackButton from "./BackButton";
import NextButton from "./NextButton";
import DeleteButton from "./DeleteButton";
import { useWizard } from "../context/WizardContext";

interface LinksFormProps {
  onBack: () => void;
  onNext: () => void;
}

export const emptyLinks: Links = {
  linkString: "",
};

export const linksSchema = Yup.object({
  linkString: Yup.string()
    .required("Link is required")
    .min(5, "Link must be at least 5 characters")
    .max(150, "Link cannot exceed 150 characters")
    .url("Please enter a valid URL (e.g., https://...)"),
});

export const linksFormValidator = Yup.object({
  links: Yup.array().of(linksSchema),
});

export default function LinksForm({ onBack, onNext }: LinksFormProps) {
  const { updateLinks, wizardData } = useWizard();

  const initialLinks: LinksFormValues = {
    links: wizardData.links.length > 0 ? wizardData.links : [{ ...emptyLinks }],
  };

  const handleSubmit = (
    values: LinksFormValues,
    helpers: FormikHelpers<LinksFormValues>,
  ) => {
    const { setSubmitting } = helpers;

    updateLinks(values.links);
    onNext();
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card_background border border-card_border rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">Links</h2>
      <p className="text-muted mb-6">
        Add your professional links (e.g., LinkedIn, GitHub, Portfolio). You can
        add multiple entries.
      </p>

      <Formik
        initialValues={initialLinks}
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
                          <DeleteButton
                            prompt="Remove link"
                            remove={() => remove(index)}
                          />
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor={`links.${index}.linkString`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          URL
                        </label>
                        <Field
                          id={`links.${index}.linkString`}
                          name={`links.${index}.linkString`}
                          placeholder="e.g., https://github.com/your-username"
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
                    Add another link
                  </button>

                  {typeof errors.links === "string" && (
                    <p className="text-sm text-error">{errors.links}</p>
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
