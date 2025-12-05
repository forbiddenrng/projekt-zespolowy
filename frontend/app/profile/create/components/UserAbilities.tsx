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

const emptyAbilities: Ability = {
  name: "",
};

const abilitiesSchema = Yup.object({
  name: Yup.string().required("Nazwa umiejętności jest wymagan")
    .min(3, "Umiejętność musi mieć co najmniej 3 znaki")
    .max(255, "Umiejętność nie może mieć więcej niż 255 znaków"),
});

const abilitiesFormValidator = Yup.object({
  abilities: Yup.array()
    .of(abilitiesSchema)
    .min(1, "Dodaj co najmniej jedną pozycję umiejętności"),
});

export default function AbilitiesForm({
  onBack,
  onNext,
}: AbilitiesFormProps) {
  const {updateAbilities, wizardData} = useWizard();

  const initialValues: AbilitiesFormValues = {
    abilities: wizardData.abilities
  };

  const handleSubmit = (
    values: AbilitiesFormValues,
    helpers: FormikHelpers<AbilitiesFormValues>
  ) => {
    const { setSubmitting } = helpers;

    updateAbilities(values.abilities)
    onNext();
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card_background border border-card_border rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">
        Umiejętności
      </h2>
      <p className="text-muted mb-6">
        Dodaj swoje umiejętności. Możesz dodać wiele pozycji.
      </p>

      <Formik
        initialValues={initialValues}
        enableReinitialize={true}
        validationSchema={abilitiesFormValidator}
        validateOnChange={false}
        validateOnBlur={false}
        onSubmit={handleSubmit} // <-- używamy handleSubmit
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
                          Umiejętność #{index + 1}
                        </h3>
                        {values.abilities.length > 1 && (
                          <DeleteButton
                            prompt="Usuń umiejętność"
                            remove={() => remove(index)}
                          />
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor={`abilities.${index}.name`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Nazwa umiejętności
                        </label>
                        <Field
                          id={`abilities.${index}.name`}
                          name={`abilities.${index}.name`}
                          placeholder="np. React, TypeScript, Docker"
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
                    Dodaj kolejną umiejętność
                  </button>

                  {typeof errors.abilities === "string" && (
                    <p className="text-sm text-error">{errors.abilities}</p>
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
