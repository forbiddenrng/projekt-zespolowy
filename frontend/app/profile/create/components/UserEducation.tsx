"use client";

import React from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import type { FormikHelpers } from "formik";
import * as Yup from "yup";
import type { Education, EducationFormValues } from "@/app/ts/types";
import BackButton from "./BackButton";
import NextButton from "./NextButton";
import DeleteButton from "./DeleteButton";
import { useWizard } from "../context/WizardContext";

interface EducationFormProps {
  onBack: () => void;
  onNext: () => void;
}

export const emptyEducation: Education = {
  schoolName: "",
  major: "",
  degree: "",
  beginDate: "",
  endDate: "",
};

export const educationSchema = Yup.object({
  schoolName: Yup.string()
    .required("School name is required")
    .min(3, "School name must be at least 3 characters")
    .max(100, "School name cannot exceed 100 characters"),
  major: Yup.string()
    .required("Major/Field of study is required")
    .min(3, "Major must be at least 3 characters")
    .max(100, "Major cannot exceed 100 characters"),
  degree: Yup.string()
    .required("Degree is required")
    .min(3, "Degree must be at least 3 characters")
    .max(50, "Degree cannot exceed 50 characters"),
  beginDate: Yup.date()
    .required("Start date is required")
    .typeError("Invalid date format")
    .test("cant-above-this-date", "Date cannot be in the future", (date) => {
      return new Date() >= (date as Date);
    }),
  endDate: Yup.date()
    .nullable()
    .typeError("Invalid date format")
    .min(Yup.ref("beginDate"), "End date must be after the start date")
    .test("cant-above-this-date", "Date cannot be in the future", (date) => {
      if (date === undefined || date === null) return true;
      return new Date() >= (date as Date);
    }),
});

export const educationFormValidator = Yup.object({
  education: Yup.array().of(educationSchema),
});

export const formatDateForInput = (dateString: string | undefined): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

export const degreeOptions = [
  { value: "", label: "Select degree" },
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "high_school", label: "High School" },
  { value: "bachelor", label: "Bachelor's Degree" },
  { value: "engineer", label: "Engineer's Degree" },
  { value: "master", label: "Master's Degree" },
  { value: "doctorate", label: "Doctorate" },
  { value: "other", label: "Other" },
];

export default function EducationForm({ onBack, onNext }: EducationFormProps) {
  const { updateEducation, wizardData } = useWizard();

  const normalizedEducation = wizardData.education.map((edu) => ({
    ...edu,
    beginDate: formatDateForInput(edu.beginDate),
    endDate: formatDateForInput(edu.endDate),
  }));

  const initialValues: EducationFormValues = {
    education:
      normalizedEducation.length > 0
        ? normalizedEducation
        : [{ ...emptyEducation }],
  };

  const handleSubmit = (
    values: EducationFormValues,
    helpers: FormikHelpers<EducationFormValues>,
  ) => {
    const { setSubmitting } = helpers;

    const formattedEducation = values.education.map((edu) => ({
      ...edu,
      beginDate: new Date(edu.beginDate).toISOString(),
      endDate: edu.endDate ? new Date(edu.endDate).toISOString() : undefined,
    }));

    updateEducation(formattedEducation);
    onNext();
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card_background border border-card_border rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">Education</h2>
      <p className="text-muted mb-6">
        Add information about your educational background. You can add multiple
        entries.
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
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-foreground">
                          Education #{index + 1}
                        </h3>
                        <DeleteButton
                          prompt="Remove education"
                          remove={() => remove(index)}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`education.${index}.schoolName`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          School / University Name
                        </label>
                        <Field
                          id={`education.${index}.schoolName`}
                          name={`education.${index}.schoolName`}
                          placeholder="e.g. Warsaw University of Technology"
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <ErrorMessage
                          name={`education.${index}.schoolName`}
                          component="p"
                          className="mt-1 text-sm text-error"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`education.${index}.major`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Major / Field of Study
                        </label>
                        <Field
                          id={`education.${index}.major`}
                          name={`education.${index}.major`}
                          placeholder="e.g. Computer Science"
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <ErrorMessage
                          name={`education.${index}.major`}
                          component="p"
                          className="mt-1 text-sm text-error"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`education.${index}.degree`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Degree / Title
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor={`education.${index}.beginDate`}
                            className="block text-sm font-medium text-foreground mb-1"
                          >
                            Start Date
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

                        <div>
                          <label
                            htmlFor={`education.${index}.endDate`}
                            className="block text-sm font-medium text-foreground mb-1"
                          >
                            End Date{" "}
                            <span className="text-muted">(optional)</span>
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
                    Add another education entry
                  </button>

                  {typeof errors.education === "string" && (
                    <p className="text-sm text-error">{errors.education}</p>
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
