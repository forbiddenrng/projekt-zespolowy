"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import type { FormikHelpers } from "formik";
import { useRouter } from "next/navigation";
import { FaTrash } from "react-icons/fa";
import {
  emptyEducation,
  educationFormValidator,
  formatDateForInput,
  degreeOptions,
} from "@/app/profile/create/components/UserEducation";
import CancelButton from "./ui/CancelButton";
import SaveButton from "./ui/SaveButton";
import AddPosition from "./ui/AddPosition";

interface EditEducation {
  id?: number;
  schoolName: string;
  major: string;
  degree: string;
  beginDate: string; // ISO format
  endDate?: string; // ISO format, optional
}

interface EditEducationFormValues {
  education: EditEducation[];
}

export default function EditEducationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<EditEducationFormValues>({
    education: [{ ...emptyEducation }],
  });

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/user/get?resource=education");
        const data = response.data?.data;

        if (data?.education && data.education.length > 0) {
          const normalizedEducation = data.education.map(
            (edu: {
              id: number;
              school_name: string;
              major: string;
              degree: string;
              begin_date: string;
              end_date?: string;
            }) => ({
              id: edu.id,
              schoolName: edu.school_name,
              major: edu.major,
              degree: edu.degree,
              beginDate: formatDateForInput(edu.begin_date),
              endDate: formatDateForInput(edu.end_date),
            }),
          );

          setFormData({
            education: normalizedEducation,
          });
        } else {
          setFormData({
            education: [{ ...emptyEducation }],
          });
        }
      } catch (err: any) {
        setError("Error loading education data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (
    values: EditEducationFormValues,
    helpers: FormikHelpers<EditEducationFormValues>,
  ) => {
    const { setSubmitting } = helpers;

    try {
      setSubmitting(true);
      setError(null);

      // Transform dates to ISO format and map to backend expected structure
      const payload = values.education.map((edu) => ({
        id: edu.id,
        schoolName: edu.schoolName,
        major: edu.major,
        degree: edu.degree,
        beginDate: new Date(edu.beginDate).toISOString(),
        endDate: edu.endDate ? new Date(edu.endDate).toISOString() : undefined,
      }));

      const res = await axios.put(
        "/api/user/profile?resource=education",
        {
          education: payload,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (res.data?.statusCode !== 200) throw new Error("Error saving data");

      setSuccessMessage("Education updated successfully!");

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
        Edit Education
      </h2>
      <p className="text-muted mb-6">
        Update your educational background. You can add or remove multiple
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
                      {/* Card Header */}
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-foreground">
                          Education #{index + 1}
                        </h3>
                        {values.education.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-error/10 hover:bg-error/20 text-error transition-colors cursor-pointer duration-200"
                            title="Remove education"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>

                      {/* School Name */}
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

                      {/* Major */}
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

                      {/* Degree */}
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

                      {/* Dates */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Start Date */}
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

                        {/* End Date */}
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

                  <AddPosition
                    onClick={() => push({ ...emptyEducation })}
                    prompt="Add another education entry"
                  />

                  {typeof errors.education === "string" && (
                    <p className="text-sm text-error">{errors.education}</p>
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
