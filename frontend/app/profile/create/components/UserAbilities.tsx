"use client";

import React from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import type { FormikHelpers } from "formik";
import * as Yup from "yup";
import type { Ability, AbilitiesFormValues } from "@/app/ts/types";
import BackButton from "./BackButton";
import NextButton from "./NextButton";
import DeleteButton from "./DeleteButton";
import { useWizard } from "../context/WizardContext";

interface AbilitiesFormProps {
  onBack: () => void;
  onNext: () => void;
}

export const emptyAbilities: Ability = {
  name: "",
};

export const abilitiesSchema = Yup.object({
  name: Yup.string()
    .required("Skill name is required")
    .min(3, "Skill must be at least 3 characters")
    .max(255, "Skill cannot exceed 255 characters"),
});

export const abilitiesFormValidator = Yup.object({
  abilities: Yup.array().of(abilitiesSchema).min(1, "Add at least one skill"),
});

export default function AbilitiesForm({ onBack, onNext }: AbilitiesFormProps) {
  const { updateAbilities, wizardData } = useWizard();

  const initialValues: AbilitiesFormValues = {
    abilities:
      wizardData.abilities.length > 0
        ? wizardData.abilities
        : [{ ...emptyAbilities }],
  };

  const handleSubmit = (
    values: AbilitiesFormValues,
    helpers: FormikHelpers<AbilitiesFormValues>,
  ) => {
    const { setSubmitting } = helpers;

    updateAbilities(values.abilities);
    onNext();
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card_background border border-card_border rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">Skills</h2>
      <p className="text-muted mb-6">
        Add your professional skills. You can add multiple items.
      </p>

      <Formik
        initialValues={initialValues}
        enableReinitialize={true}
        validationSchema={abilitiesFormValidator}
        validateOnChange={false}
        validateOnBlur={false}
        onSubmit={handleSubmit}
      >
        {({ values, isSubmitting, errors }) => (
          <Form className="space-y-6">
            <FieldArray name="abilities">
              {({ push, remove }) => (
                <div className="space-y-6">
                  {values.abilities.map((_, index) => (
                    <div
                      key={index}
                      className="p-5 bg-secondary border border-border rounded-lg space-y-4 relative"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-foreground">
                          Skill #{index + 1}
                        </h3>
                        {values.abilities.length > 1 && (
                          <DeleteButton
                            prompt="Remove skill"
                            remove={() => remove(index)}
                          />
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor={`abilities.${index}.name`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Skill Name
                        </label>
                        <Field
                          id={`abilities.${index}.name`}
                          name={`abilities.${index}.name`}
                          placeholder="e.g. React, TypeScript, Docker"
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <ErrorMessage
                          name={`abilities.${index}.name`}
                          component="p"
                          className="mt-1 text-sm text-error"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => push({ ...emptyAbilities })}
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
                    Add another skill
                  </button>

                  {typeof errors.abilities === "string" && (
                    <p className="text-sm text-error">{errors.abilities}</p>
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
