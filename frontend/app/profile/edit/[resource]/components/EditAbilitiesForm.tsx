"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import type { FormikHelpers } from "formik";

import { useRouter } from "next/navigation";
import { FaTrash } from "react-icons/fa";
import {
  emptyAbilities,
  abilitiesFormValidator,
} from "@/app/profile/create/components/UserAbilities";
import CancelButton from "./ui/CancelButton";
import SaveButton from "./ui/SaveButton";
import AddPosition from "./ui/AddPosition";

interface EditAbility {
  id?: number;
  name: string;
}

interface EditAbilitiesFormValues {
  abilities: EditAbility[];
}

export default function EditAbilitiesForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<EditAbilitiesFormValues>({
    abilities: [{ ...emptyAbilities }],
  });

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/user/get?resource=abilities");
        const data = response.data?.data;

        if (data?.abilities && data.abilities.length > 0) {
          setFormData({
            abilities: data.abilities.map(
              (ability: { id: number; name: string }) => ({
                name: ability.name,
                id: ability.id,
              }),
            ),
          });
        } else {
          setFormData({
            abilities: [{ ...emptyAbilities }],
          });
        }
      } catch (err: any) {
        setError(err?.message || "Error loading data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (
    values: EditAbilitiesFormValues,
    helpers: FormikHelpers<EditAbilitiesFormValues>,
  ) => {
    const { setSubmitting } = helpers;

    try {
      setSubmitting(true);
      setError(null);

      const payload = values.abilities;

      const res = await axios.put(
        "/api/user/profile?resource=abilities",
        {
          abilities: payload,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (res.data?.statusCode !== 200) throw new Error("Error saving data");

      setSuccessMessage("Skills updated successfully!");

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
        Edit Skills
      </h2>
      <p className="text-muted mb-6">
        Update your skills. You can add or remove multiple entries.
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
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-error/10 hover:bg-error/20 text-error transition-colors cursor-pointer duration-200"
                            title="Remove skill"
                          >
                            <FaTrash />
                          </button>
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

                  <AddPosition
                    onClick={() => push({ ...emptyAbilities })}
                    prompt="Add another skill"
                  />

                  {typeof errors.abilities === "string" && (
                    <p className="text-sm text-error">{errors.abilities}</p>
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
