"use client";

import React from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import type { FormikHelpers } from "formik";
import * as Yup from "yup";
import type { Education, EducationFormValues } from "@/app/ts/types";
import BackButton from "./BackButton";
import NextButton from "./NextButton";

interface EducationFormProps {
  initialEducation?: Education[];
  onBack: () => void;
  onNext: (education: Education[]) => void;
}

const emptyEducation: Education = {
  schoolName: "",
  major: "",
  degree: "",
  beginDate: "",
  endDate: "",
};

const educationSchema = Yup.object({
  schoolName: Yup.string().required("Nazwa szkoły jest wymagana"),
  major: Yup.string().required("Kierunek jest wymagany"),
  degree: Yup.string().required("Stopień jest wymagany"),
  beginDate: Yup.date()
    .required("Data rozpoczęcia jest wymagana")
    .typeError("Niepoprawny format daty"),
  endDate: Yup.date()
    .nullable()
    .typeError("Niepoprawny format daty")
    .min(Yup.ref("beginDate"), "Data zakończenia musi być późniejsza niż rozpoczęcia"),
});

const educationFormValidator = Yup.object({
  education: Yup.array()
    .of(educationSchema)
    .min(1, "Dodaj co najmniej jedną pozycję edukacji"),
});

const formatDateForInput = (dateString: string | undefined): string => {
  if(!dateString) return "";
  try {
    const date = new Date(dateString);
    if(isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

const degreeOptions = [
  { value: "", label: "Wybierz stopień" },
  { value: "podstawowe", label: "Podstawowe" },
  { value: "gimnazjalne", label: "Gimnazjalne" },
  { value: "średnie", label: "Średnie" },
  { value: "licencjat", label: "Licencjat" },
  { value: "inżynier", label: "Inżynier" },
  { value: "magister", label: "Magister" },
  { value: "doktor", label: "Doktor" },
  { value: "inne", label: "Inne" },
];

export default function EducationForm({
  initialEducation = [],
  onBack,
  onNext,
}: EducationFormProps) {

  const normalizedEducation = initialEducation.map(edu => ({
    ...edu,
    beginDate: formatDateForInput(edu.beginDate),
    endDate: formatDateForInput(edu.endDate)
  }));

  const initialValues: EducationFormValues = {
    education: normalizedEducation.length > 0 ? normalizedEducation : [{ ...emptyEducation }],
  };

  // console.log("init edu")
  // console.log(initialValues)

  const handleSubmit = (
    values: EducationFormValues,
    helpers: FormikHelpers<EducationFormValues>
  ) => {
    const { setSubmitting } = helpers;
    
    // Przekształć daty do formatu ISO
    const formattedEducation = values.education.map((edu) => ({
      ...edu,
      beginDate: new Date(edu.beginDate).toISOString(),
      endDate: edu.endDate ? new Date(edu.endDate).toISOString() : undefined,
    }));

    onNext(formattedEducation);
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card_background border border-card_border rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">Edukacja</h2>
      <p className="text-muted mb-6">
        Dodaj informacje o swojej edukacji. Możesz dodać wiele pozycji.
      </p>

      <Formik
        initialValues={initialValues}
        enableReinitialize={true}
        validationSchema={educationFormValidator}
        validateOnChange={false}
        validateOnBlur={false}
        onSubmit={handleSubmit}
      >
        {({ values, isSubmitting, errors }) => (
          <Form className="space-y-6">
            <FieldArray name="education">
              {({ push, remove }) => (
                <div className="space-y-6">
                  {values.education.map((_, index) => (
                    <div
                      key={index}
                      className="p-5 bg-secondary border border-border rounded-lg space-y-4 relative"
                    >
                      {/* Nagłówek karty */}
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-foreground">
                          Edukacja #{index + 1}
                        </h3>
                        {values.education.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-error hover:text-red-400 transition-colors p-1"
                            aria-label="Usuń edukację"
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

                      {/* Nazwa szkoły */}
                      <div>
                        <label
                          htmlFor={`education.${index}.schoolName`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Nazwa szkoły / uczelni
                        </label>
                        <Field
                          id={`education.${index}.schoolName`}
                          name={`education.${index}.schoolName`}
                          placeholder="np. Politechnika Warszawska"
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <ErrorMessage
                          name={`education.${index}.schoolName`}
                          component="p"
                          className="mt-1 text-sm text-error"
                        />
                      </div>

                      {/* Kierunek */}
                      <div>
                        <label
                          htmlFor={`education.${index}.major`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Kierunek / Profil
                        </label>
                        <Field
                          id={`education.${index}.major`}
                          name={`education.${index}.major`}
                          placeholder="np. Informatyka"
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <ErrorMessage
                          name={`education.${index}.major`}
                          component="p"
                          className="mt-1 text-sm text-error"
                        />
                      </div>

                      {/* Stopień */}
                      <div>
                        <label
                          htmlFor={`education.${index}.degree`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Stopień / Tytuł
                        </label>
                        <Field
                          as="select"
                          id={`education.${index}.degree`}
                          name={`education.${index}.degree`}
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        >
                          {degreeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Field>
                        <ErrorMessage
                          name={`education.${index}.degree`}
                          component="p"
                          className="mt-1 text-sm text-error"
                        />
                      </div>

                      {/* Daty */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Data rozpoczęcia */}
                        <div>
                          <label
                            htmlFor={`education.${index}.beginDate`}
                            className="block text-sm font-medium text-foreground mb-1"
                          >
                            Data rozpoczęcia
                          </label>
                          <Field
                            type="date"
                            id={`education.${index}.beginDate`}
                            name={`education.${index}.beginDate`}
                            className="w-full p-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          />
                          <ErrorMessage
                            name={`education.${index}.beginDate`}
                            component="p"
                            className="mt-1 text-sm text-error"
                          />
                        </div>

                        {/* Data zakończenia */}
                        <div>
                          <label
                            htmlFor={`education.${index}.endDate`}
                            className="block text-sm font-medium text-foreground mb-1"
                          >
                            Data zakończenia{" "}
                            <span className="text-muted">(opcjonalne)</span>
                          </label>
                          <Field
                            type="date"
                            id={`education.${index}.endDate`}
                            name={`education.${index}.endDate`}
                            className="w-full p-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          />
                          <ErrorMessage
                            name={`education.${index}.endDate`}
                            component="p"
                            className="mt-1 text-sm text-error"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Przycisk dodawania */}
                  <button
                    type="button"
                    onClick={() => push({ ...emptyEducation })}
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
                    Dodaj kolejną edukację
                  </button>

                  {/* Błąd walidacji tablicy */}
                  {typeof errors.education === "string" && (
                    <p className="text-sm text-error">{errors.education}</p>
                  )}
                </div>
              )}
            </FieldArray>

            {/* Przyciski nawigacji */}
            <div className="flex justify-between gap-4 pt-6 border-t border-border">
              <BackButton
                prompt={"Wstecz"}
                onBack={onBack}
              />

              <NextButton
                prompt={"Dalej"}
                isSubmitting={isSubmitting}
              />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}