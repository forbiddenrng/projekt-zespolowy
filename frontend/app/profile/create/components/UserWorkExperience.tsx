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

export const emptyWorkExp: WorkExp = {
  companyName: "",
  position: "",
  beginDate: "",
  endDate: "",
  description: "",
};

export const workExpSchema = Yup.object({
  companyName: Yup.string()
    .required("Company name is required")
    .min(3, "Company name must be at least 3 characters")
    .max(100, "Company name cannot exceed 100 characters"),
  position: Yup.string()
    .required("Position is required")
    .min(3, "Position must be at least 3 characters")
    .max(100, "Position cannot exceed 100 characters"),
  beginDate: Yup.date()
    .required("Start date is required")
    .typeError("Invalid date format")
    .test("is-valid-date", "Date cannot be in the future", (value) => {
      if (!value) return true;
      return new Date(value) <= new Date();
    }),
  endDate: Yup.date()
    .nullable()
    .typeError("Invalid date format")
    .min(Yup.ref("beginDate"), "End date must be after the start date"),
  description: Yup.string()
    .required("Job description is required")
    .min(10, "Description must be at least 10 characters"),
});

export const workExpFormValidator = Yup.object({
  workExp: Yup.array().of(workExpSchema),
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

export default function WorkExpForm({ onBack, onNext }: WorkExpFormProps) {
  const { updateWorkExperience, wizardData } = useWizard();
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
    helpers: FormikHelpers<WorkExpFormValues>,
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
        Work Experience
      </h2>
      <p className="text-muted mb-6">
        Add information about your professional experience. You can add multiple
        entries.
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
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-foreground">
                          Experience #{index + 1}
                        </h3>
                        <DeleteButton
                          prompt="Remove experience"
                          remove={() => remove(index)}
                        />
                      </div>

                      {/* Company Name */}
                      <div>
                        <label
                          htmlFor={`workExp.${index}.companyName`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Company Name
                        </label>
                        <Field
                          id={`workExp.${index}.companyName`}
                          name={`workExp.${index}.companyName`}
                          placeholder="e.g. Acme Corp"
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <ErrorMessage
                          name={`workExp.${index}.companyName`}
                          component="p"
                          className="mt-1 text-sm text-error"
                        />
                      </div>

                      {/* Position */}
                      <div>
                        <label
                          htmlFor={`workExp.${index}.position`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Position
                        </label>
                        <Field
                          id={`workExp.${index}.position`}
                          name={`workExp.${index}.position`}
                          placeholder="e.g. Software Engineer"
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <ErrorMessage
                          name={`workExp.${index}.position`}
                          component="p"
                          className="mt-1 text-sm text-error"
                        />
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Start Date */}
                        <div>
                          <label
                            htmlFor={`workExp.${index}.beginDate`}
                            className="block text-sm font-medium text-foreground mb-1"
                          >
                            Start Date
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

                        {/* End Date */}
                        <div>
                          <label
                            htmlFor={`workExp.${index}.endDate`}
                            className="block text-sm font-medium text-foreground mb-1"
                          >
                            End Date{" "}
                            <span className="text-muted">(optional)</span>
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

                      {/* Description */}
                      <div>
                        <label
                          htmlFor={`workExp.${index}.description`}
                          className="block text-sm font-medium text-foreground mb-1"
                        >
                          Description of Responsibilities
                        </label>
                        <Field
                          as="textarea"
                          id={`workExp.${index}.description`}
                          name={`workExp.${index}.description`}
                          placeholder="Describe your responsibilities and achievements"
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
                    Add another experience entry
                  </button>

                  {typeof errors.workExp === "string" && (
                    <p className="text-sm text-error">{errors.workExp}</p>
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
