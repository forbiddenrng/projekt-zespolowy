"use client";

import React from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import type { FormikHelpers } from "formik";
import * as Yup from "yup";
import type { WorkExp, WorkExpFormValues } from "@/app/ts/types";
import BackButton from "./BackButton";
import NextButton from "./NextButton";
import DeleteButton from "./DeleteButton";
import { useWizard } from "../context/WizardContext";

interface WorkExpFormProps {
  onBack: () => void;
  onNext: () => void;
}

const emptyWorkExp: WorkExp = {
  companyName: "",
  position: "",
  beginDate: "",
  endDate: "",
  description: "",
};

const workExpSchema = Yup.object({
  companyName: Yup.string().required("Nazwa firmy jest wymagana")
  .min(3, "Nazwa firmy musi mieć co najmniej 3 znaki")
  .max(100, "Nazwa firmy nie może być dłuższa niż 100 znaków"),
  position: Yup.string().required("Stanowisko jest wymagane")
  .min(3, "Stanowisko musi mieć co najmniej 3 znaki")
  .max(100, "Stanowisko nie może być dłuższe niż 100 znaków"),
  beginDate: Yup.date()
    .required("Data rozpoczęcia jest wymagana")
    .typeError("Niepoprawny format daty")
    .test('is-valid-date', "Data nie może być późniejsza niż dzisiaj", (value) => {
      if (!value) return true;
      return new Date(value) < new Date();
    }),
  endDate: Yup.date()
    .nullable()
    .typeError("Niepoprawny format daty")
    .min(
      Yup.ref("beginDate"),
      "Data zakończenia musi być późniejsza niż rozpoczęcia"
    ),
  description: Yup.string().required("Opis stanowiska jest wymagany")
  .min(10, "Opis stanowiska musi mieć co najmniej 10 znaków"),
});

const workExpFormValidator = Yup.object({
  workExp: Yup.array()
    .of(workExpSchema)
});

const formatDateForInput = (dateString: string | undefined): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

export default function WorkExpForm({
  onBack,
  onNext,
}: WorkExpFormProps) {

  const {updateWorkExperience, wizardData} = useWizard();
  const normalizedWorkExp = wizardData.workExperience.map((work) => ({
    ...work,
    beginDate: formatDateForInput(work.beginDate),
    endDate: formatDateForInput(work.endDate),
  }));

  const initialValues: WorkExpFormValues = {
    workExp:
      normalizedWorkExp.length > 0 ? normalizedWorkExp : [{ ...emptyWorkExp }],
  };

  const handleSubmit = (
    values: WorkExpFormValues,
    helpers: FormikHelpers<WorkExpFormValues>
  ) => {
    const { setSubmitting } = helpers;

    const formattedWorkExp = values.workExp.map((work) => ({
      ...work,
      beginDate: new Date(work.beginDate).toISOString(),
      endDate: work.endDate ? new Date(work.endDate).toISOString() : undefined,
    }));
    
    updateWorkExperience(formattedWorkExp);
    onNext();
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card_background border border-card_border rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">
        Doświadczenie Zawodowe
      </h2>
      <p className="text-muted mb-6">
        Dodaj informacje o swoim doświadczeniu zawodowym. Możesz dodać wiele
        pozycji.
      </p>

      <Formik
        initialValues={initialValues}
        enableReinitialize={true}
        validationSchema={workExpFormValidator}
        validateOnChange={false}
        validateOnBlur={false}
        onSubmit={handleSubmit}
      >
        {({ values, isSubmitting, errors }) => (
          <Form className="space-y-6">
            <FieldArray name="workExp">
              {({ push, remove }) => (
                <div className="space-y-6">
                  {values.workExp.map((_, index) => (
                    <div
                      key={index}
                      className="p-5 bg-secondary border border-border rounded-lg space-y-4 relative"
                    >
                      {/* Nagłówek karty */}
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-foreground">
                          Doświadczenie #{index + 1}
                        </h3>
                        <DeleteButton
                          prompt="Usuń doświadczenie"
                          remove={() => remove(index)}
                        />
                      </div>

                      {/* Nazwa firmy */}
                      <div>
                        <label
                          htmlFor={`workExp.${index}.companyName`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Nazwa firmy
                        </label>
                        <Field
                          id={`workExp.${index}.companyName`}
                          name={`workExp.${index}.companyName`}
                          placeholder="np. ABC Sp. z o.o."
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <ErrorMessage
                          name={`workExp.${index}.companyName`}
                          component="p"
                          className="mt-1 text-sm text-error"
                        />
                      </div>

                      {/* Stanowisko */}
                      <div>
                        <label
                          htmlFor={`workExp.${index}.position`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Stanowisko
                        </label>
                        <Field
                          id={`workExp.${index}.position`}
                          name={`workExp.${index}.position`}
                          placeholder="np. Inżynier Oprogramowania"
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <ErrorMessage
                          name={`workExp.${index}.position`}
                          component="p"
                          className="mt-1 text-sm text-error"
                        />
                      </div>

                      {/* Daty */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Data rozpoczęcia */}
                        <div>
                          <label
                            htmlFor={`workExp.${index}.beginDate`}
                            className="block text-sm font-medium text-foreground mb-1"
                          >
                            Data rozpoczęcia
                          </label>
                          <Field
                            type="date"
                            id={`workExp.${index}.beginDate`}
                            name={`workExp.${index}.beginDate`}
                            className="w-full p-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          />
                          <ErrorMessage
                            name={`workExp.${index}.beginDate`}
                            component="p"
                            className="mt-1 text-sm text-error"
                          />
                        </div>

                        {/* Data zakończenia */}
                        <div>
                          <label
                            htmlFor={`workExp.${index}.endDate`}
                            className="block text-sm font-medium text-foreground mb-1"
                          >
                            Data zakończenia{" "}
                            <span className="text-muted">(opcjonalne)</span>
                          </label>
                          <Field
                            type="date"
                            id={`workExp.${index}.endDate`}
                            name={`workExp.${index}.endDate`}
                            className="w-full p-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          />
                          <ErrorMessage
                            name={`workExp.${index}.endDate`}
                            component="p"
                            className="mt-1 text-sm text-error"
                          />
                        </div>
                      </div>

                      {/* Opis */}
                      <div>
                        <label
                          htmlFor={`workExp.${index}.description`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Opis obowiązków
                        </label>
                        <Field
                          as="textarea"
                          id={`workExp.${index}.description`}
                          name={`workExp.${index}.description`}
                          placeholder="Opisz swoje obowiązki i osiągnięcia"
                          rows={4}
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                        />
                        <ErrorMessage
                          name={`workExp.${index}.description`}
                          component="p"
                          className="mt-1 text-sm text-error"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Przycisk dodawania */}
                  <button
                    type="button"
                    onClick={() => push({ ...emptyWorkExp })}
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
                    Dodaj kolejne doświadczenie
                  </button>

                  {/* Błąd walidacji tablicy */}
                  {typeof errors.workExp === "string" && (
                    <p className="text-sm text-error">{errors.workExp}</p>
                  )}
                </div>
              )}
            </FieldArray>

            {/* Przyciski nawigacji */}
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
