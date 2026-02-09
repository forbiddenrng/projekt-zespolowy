"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { UserFormValues, SavedProfile } from "@/app/ts/types";
import type { FormikHelpers } from "formik";
import * as Yup from "yup";
import NextButton from "./NextButton";
import { useWizard } from "../context/WizardContext";

interface UserFormProps {
  user: {
    name?: string;
    email?: string;
    family_name?: string;
    given_name?: string;
    sub: string;
  };
  onNext: () => void;
}

export const userValidator = Yup.object({
  name: Yup.string()
    .required("First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(100, "First name cannot exceed 100 characters"),
  surname: Yup.string()
    .required("Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(100, "Last name cannot exceed 100 characters"),
  phoneNum: Yup.string()
    .required("Phone number is required")
    .min(9, "Phone number must be at least 9 characters")
    .max(20, "Phone number cannot exceed 20 characters"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  city: Yup.string()
    .required("City is required")
    .min(2, "City must be at least 2 characters")
    .max(100, "City cannot exceed 100 characters"),
  profileSummary: Yup.string()
    .optional()
    .min(20, "Profile summary must be at least 20 characters"),
});

const emptyFormValues: UserFormValues = {
  name: "",
  surname: "",
  phoneNum: "",
  email: "",
  city: "",
  profileSummary: "",
};

export default function UserForm({ user, onNext }: UserFormProps) {
  const { updateUserInfo, wizardData } = useWizard();

  const initialFormValues = useMemo<UserFormValues>(() => {
    return {
      name: wizardData.userInfo?.name || user?.name || user?.given_name || "",
      surname: wizardData.userInfo?.surname || user?.family_name || "",
      phoneNum: wizardData.userInfo?.phoneNum || "",
      email: wizardData.userInfo?.email || user?.email || "",
      city: wizardData.userInfo?.city || "",
      profileSummary: wizardData.userInfo?.profileSummary || "",
    };
  }, [user, wizardData.userInfo]);

  const handleSubmit = async (
    values: UserFormValues,
    helpers: FormikHelpers<UserFormValues>,
  ) => {
    const { setSubmitting } = helpers;

    try {
      setSubmitting(true);
      updateUserInfo(values);
      onNext();
    } catch (err: any) {
      console.error("Submit error:", err);
      alert("An error occurred during save: " + (err?.message ?? "unknown"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card_background border border-card_border rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">
        Personal Data
      </h2>
      <p className="text-muted mb-6">
        Please provide your personal information.
      </p>

      <Formik
        initialValues={initialFormValues}
        enableReinitialize={true}
        validationSchema={userValidator}
        validateOnChange={false}
        validateOnBlur={false}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, resetForm }) => (
          <Form className="space-y-5">
            {/* First Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-foreground mb-1"
              >
                First Name
              </label>
              <Field
                id="name"
                name="name"
                placeholder="John"
                aria-label="First Name"
                className="w-full p-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <ErrorMessage
                name="name"
                component="p"
                className="mt-1 text-sm text-error"
              />
            </div>

            {/* Last Name */}
            <div>
              <label
                htmlFor="surname"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Last Name
              </label>
              <Field
                id="surname"
                name="surname"
                placeholder="Doe"
                aria-label="Last Name"
                className="w-full p-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <ErrorMessage
                name="surname"
                component="p"
                className="mt-1 text-sm text-error"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phoneNum"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Phone Number
              </label>
              <Field
                id="phoneNum"
                name="phoneNum"
                placeholder="+44 600 000 000"
                aria-label="Phone Number"
                className="w-full p-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <ErrorMessage
                name="phoneNum"
                component="p"
                className="mt-1 text-sm text-error"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Email
              </label>
              <Field
                id="email"
                name="email"
                type="email"
                placeholder="email@example.com"
                aria-label="Email"
                className="w-full p-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <ErrorMessage
                name="email"
                component="p"
                className="mt-1 text-sm text-error"
              />
            </div>

            {/* City */}
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-foreground mb-1"
              >
                City
              </label>
              <Field
                id="city"
                name="city"
                placeholder="London"
                aria-label="City"
                className="w-full p-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <ErrorMessage
                name="city"
                component="p"
                className="mt-1 text-sm text-error"
              />
            </div>

            {/* Summary */}
            <div>
              <label
                htmlFor="profileSummary"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Profile Summary / Professional Description
              </label>
              <Field
                as="textarea"
                id="profileSummary"
                name="profileSummary"
                rows={5}
                className="w-full p-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-vertical"
              />
              <ErrorMessage
                name="profileSummary"
                component="p"
                className="mt-1 text-sm text-error"
              />
            </div>

            <div className="flex gap-4 justify-between pt-4">
              <button
                type="button"
                onClick={() => resetForm({ values: emptyFormValues })}
                className="px-6 py-3 bg-secondary border border-border text-foreground hover:bg-border rounded-lg font-medium transition-colors duration-200 cursor-pointer"
              >
                Reset
              </button>

              <NextButton
                prompt={isSubmitting ? "Saving..." : "Next"}
                isSubmitting={isSubmitting}
              />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
