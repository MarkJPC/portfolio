"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSettingsSchema } from "@/lib/schemas/settingsSchemas";
import { UserSettings } from "@/lib/types/settingTypes";
import { useState, useEffect } from "react";
import { fetchSettings } from "@/utils/supabaseActions";
import { submitSettings } from "@/utils/supabaseActions";

export default function SettingsForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset, // Used to update form values dynamically
    formState: { errors },
  } = useForm<UserSettings>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: {}, // Start with empty default values
  });

  useEffect(() => {
    setLoading(true);
    fetchSettings().then((data) => {
      if (data) {
        reset(data); // Reset form with fetched data
        console.log("Fetched settings data:", data);
        setLoading(false);
      } else {
        setError("Failed to fetch settings data.");
      }
    })
  }, [reset]);

  const onSubmit = async (data: UserSettings) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    submitSettings(data)
      .then(() => {
        setSuccess("Settings updated successfully!");
        setLoading(false);
      })
      .catch((error) => {
        setError("Failed to update settings. Please try again.");
        console.error("Error updating settings:", error);
        setLoading(false);
      });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 tech-card p-6">
      {error && <p className="text-destructive">{error}</p>}
      {success && <p className="block text-sm text-muted-foreground">{success}</p>}

      <h1 className="tech-heading text-2xl">Settings</h1>

      <div className="space-y-4">
        <div className="tech-section">
          <label htmlFor="address" className="block text-sm text-muted-foreground">
            Address
          </label>
          <input id="address" {...register("address")} className="tech-input" />
          {errors.address && <p className="text-destructive text-sm">{errors.address.message}</p>}
        </div>

        <div className="tech-section">
          <label htmlFor="phone_number" className="block text-sm text-muted-foreground">
            Phone Number
          </label>
          <input id="phone_number" {...register("phone_number")} className="tech-input" />
          {errors.phone_number && (
            <p className="text-destructive text-sm">{errors.phone_number.message}</p>
          )}
        </div>

        <div className="tech-section">
          <label htmlFor="email" className="block text-sm text-muted-foreground">
            Email
          </label>
          <input id="email" {...register("email")} className="tech-input" required />
          {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
        </div>

        <div className="tech-section">
          <label htmlFor="linkedin_url" className="block text-sm text-muted-foreground">
            LinkedIn URL
          </label>
          <input id="linkedin_url" {...register("linkedin_url")} className="tech-input" />
          {errors.linkedin_url && (
            <p className="text-destructive text-sm">{errors.linkedin_url.message}</p>
          )}
        </div>

        <div className="tech-section">
          <label htmlFor="github_url" className="block text-sm text-muted-foreground">
            GitHub URL
          </label>
          <input id="github_url" {...register("github_url")} className="tech-input" />
          {errors.github_url && (
            <p className="text-destructive text-sm">{errors.github_url.message}</p>
          )}
        </div>

        <div className="tech-section">
          <label htmlFor="website_1_url" className="block text-sm text-muted-foreground">
            Website URL 1
          </label>
          <input id="website_1_url" {...register("website_1_url")} className="tech-input" />
          {errors.website_1_url && (
            <p className="text-destructive text-sm">{errors.website_1_url.message}</p>
          )}
        </div>

        <div className="tech-section">
          <label htmlFor="website_2_url" className="block text-sm text-muted-foreground">
            Website URL 2
          </label>
          <input id="website_2_url" {...register("website_2_url")} className="tech-input" />
          {errors.website_2_url && (
            <p className="text-destructive text-sm">{errors.website_2_url.message}</p>
          )}
        </div>
      </div>

      <div className="tech-section">
        <label htmlFor="about_me" className="block text-sm text-muted-foreground">
          About Me
        </label>
        <textarea id="about_me" {...register("about_me")} className="tech-textarea" />
        {errors.about_me && <p className="text-destructive text-sm">{errors.about_me.message}</p>}
      </div>

      <div className="tech-section">
          <label htmlFor="about_short" className="block text-sm text-muted-foreground">
          Short About Me
          </label>
          <textarea id="about_short" {...register("about_short")} className="tech-textarea" />
          {errors.about_short && (
          <p className="text-destructive text-sm">{errors.about_short.message}</p>
          )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="tech-button w-full flex justify-center items-center"
      >
        {loading ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}