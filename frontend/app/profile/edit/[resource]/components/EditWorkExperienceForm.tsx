"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import type { FormikHelpers } from "formik";
import { useRouter } from "next/navigation";
import { FaTrash } from "react-icons/fa";
import {
  emptyWorkExp,
  workExpFormValidator,
  formatDateForInput,
} from "@/app/profile/create/components/UserWorkExperience";
import CancelButton from "./ui/CancelButton";
import SaveButton from "./ui/SaveButton";
import AddPosition from "./ui/AddPosition";

interface EditWorkExp {
  id?: number;
  companyName: string;
  position: string;
  beginDate: string; // ISO format
  endDate?: string; // ISO format, optional
  description: string;
}

interface EditWorkExperienceFormValues {
  workExp: EditWorkExp[];
}

export default function EditWorkExperienceForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<EditWorkExperienceFormValues>({
    workExp: [{ ...emptyWorkExp }],
  });

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/user/get?resource=work");
        const data = response.data?.data;

        if (data?.work_experiences && data.work_experiences.length > 0) {
          const normalizedWorkExp = data.work_experiences.map(
            (work: {
              id?: number;
              company_name: string;
              position: string;
              begin_date: string;
              end_date?: string;
              description: string;
            }) => ({
              id: work.id,
              companyName: work.company_name,
              position: work.position,
              beginDate: formatDateForInput(work.begin_date),
              endDate: formatDateForInput(work.end_date),
              description: work.description,
            }),
          );

          setFormData({
            workExp: normalizedWorkExp,
          });
        } else {
          setFormData({
            workExp: [{ ...emptyWorkExp }],
          });
        }
      } catch (err: any) {
        setError("Error loading work experience data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (
    values: EditWorkExperienceFormValues,
    helpers: FormikHelpers<EditWorkExperienceFormValues>,
  ) => {
    const { setSubmitting } = helpers;

    try {
      setSubmitting(true);
      setError(null);

      // Transform dates to ISO and map to backend format
      const payload = values.workExp.map((work) => ({
        id: work.id,
        companyName: work.companyName,
        position: work.position,
        beginDate: new Date(work.beginDate).toISOString(),
        endDate: work.endDate
          ? new Date(work.endDate).toISOString()
          : undefined,
        description: work.description,
      }));

      const res = await axios.put(
        "/api/user/profile?resource=work",
        {
          workExperiences: payload,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (res.data?.statusCode !== 200) throw new Error("Error saving data");

      setSuccessMessage("Work experience updated successfully!");

      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    } catch (err: any) {
      setError("An error occurred while saving data");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-card-background border border-card-border rounded-lg shadow-lg">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card-background border border-card-border rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">
        Edit Work Experience
      </h2>
      <p className="text-muted mb-6">
        Update your professional history. You can add or remove multiple
        entries.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error text-error rounded-lg">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-success/10 border border-success text-success rounded-lg">
          {successMessage}
        </div>
      )}

      <Formik
        initialValues={formData}
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
                      {/* Card Header */}
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-foreground">
                          Experience #{index + 1}
                        </h3>
                        {values.workExp.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-error/10 hover:bg-error/20 text-error transition-colors cursor-pointer duration-200"
                            title="Remove experience"
                          >
                            <FaTrash />
                          </button>
                        )}
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
                          placeholder="e.g. ABC Inc."
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
                          Responsibilities
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

                  <AddPosition
                    onClick={() => push({ ...emptyWorkExp })}
                    prompt="Add another experience"
                  />

                  {typeof errors.workExp === "string" && (
                    <p className="text-sm text-error">{errors.workExp}</p>
                  )}
                </div>
              )}
            </FieldArray>

            <div className="flex justify-between gap-4 pt-6 border-t border-border">
              <CancelButton onClick={() => router.back()} />
              <SaveButton isSubmitting={isSubmitting} />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
