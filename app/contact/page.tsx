"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/utils/supabase/client";
import { Mail, Phone, Github, Linkedin, Clipboard } from "lucide-react";
import { contactFormSchema } from "@/lib/schemas/contactSchemas";
import emailjs from "emailjs-com";

const supabase = createClient();

type ContactFormInputs = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const [socials, setSocials] = useState<{
    phone_number: string;
    email: string;
    github_url: string;
    linkedin_url: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [formStatus, setFormStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [copied, setCopied] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormInputs>({
    resolver: zodResolver(contactFormSchema),
  });

  const fetchSocials = async () => {
    const { data, error } = await supabase.from("user_settings").select("phone_number, email, github_url, linkedin_url").single();
    if (!error) setSocials(data);
    setLoading(false);
  };

  const handleCopy = (text: string) => {
    console.log("Copying text:", text); // Debugging line
    navigator.clipboard.writeText(text);
    setCopied(text); // Set the copied text
    setTimeout(() => setCopied(null), 2000); // Clear the copied state after 2 seconds
  };

  const onSubmit = async (data: ContactFormInputs) => {
    setFormStatus("sending");
    try {
      const response = await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      );
  
      if (response.status === 200) {
        setFormStatus("success");
        reset();
      } else {
        throw new Error("Failed to send email");
      }
    } catch (error) {
      console.error("EmailJS Error:", error);
      setFormStatus("error");
    }
  };

  useEffect(() => {
    fetchSocials();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <h1 className="text-3xl font-bold mb-6 tech-heading">Contact</h1>

      {/* Connection Protocols */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 tech-heading">Connection Protocols</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ul className="space-y-4">
            {socials && (
              <>
                <li className="flex items-center gap-4 tech-border p-4">
                  <Phone className="text-primary" />
                  <span className="flex-1">phone: {socials.phone_number}</span>
                  <Clipboard
                    className="cursor-pointer text-muted-foreground hover:text-primary"
                    onClick={() => handleCopy(socials.phone_number)}
                  />
                    {copied === socials.phone_number && (
                        <span className="absolute right-72 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md animate-fade-in">
                        Copied!
                        </span>
                    )}
                </li>
                <li className="flex items-center gap-4 tech-border p-4">
                  <Mail className="text-primary" />
                  <span className="flex-1">email: {socials.email}</span>
                  <Clipboard
                    className="cursor-pointer text-muted-foreground hover:text-primary"
                    onClick={() => handleCopy(socials.email)}
                  />
                    {copied === socials.email && (
                        <span className="absolute right-72 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md animate-fade-in">
                        Copied!
                        </span>
                    )}
                </li>
                <li className="flex items-center gap-4 tech-border p-4">
                  <Github className="text-primary" />
                  <a href={socials.github_url} target="_blank" rel="noopener noreferrer" className="flex-1 hover:underline">
                    github: {socials.github_url}
                  </a>
                  <Clipboard
                    className="cursor-pointer text-muted-foreground hover:text-primary"
                    onClick={() => handleCopy(socials.github_url)}
                  />
                  {copied === socials.github_url && (
                    <span className="absolute right-72 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md animate-fade-in">
                      Copied!
                    </span>
                  )}
                </li>
                <li className="flex items-center gap-4 tech-border p-4">
                  <Linkedin className="text-primary" />
                  <a href={socials.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex-1 hover:underline">
                    linkedin: {socials.linkedin_url}
                  </a>
                  <Clipboard
                    className="cursor-pointer text-muted-foreground hover:text-primary"
                    onClick={() => handleCopy(socials.linkedin_url)}
                  />
                  {copied === socials.linkedin_url && (
                    <span className="absolute right-72 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md animate-fade-in">
                      Copied!
                    </span>
                  )}
                </li>
              </>
            )}
          </ul>
        )}
      </section>

      {/* New Message Request */}
      <section>
        <h2 className="text-xl font-semibold mb-4 tech-heading">New Message Request</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block font-mono mb-2">From:</label>
            <input
              {...register("name")}
              className="tech-input w-full"
              placeholder="Your Name"
            />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block font-mono mb-2">Reply Protocol:</label>
            <input
              {...register("email")}
              className="tech-input w-full"
              placeholder="Your Email"
            />
            {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block font-mono mb-2">Message Subject:</label>
            <input
              {...register("subject")}
              className="tech-input w-full"
              placeholder="Subject"
            />
            {errors.subject && <p className="text-destructive text-sm">{errors.subject.message}</p>}
          </div>
          <div>
            <label className="block font-mono mb-2">Message Content:</label>
            <textarea
              {...register("message")}
              className="tech-input w-full"
              placeholder="Your Message"
              rows={4}
            />
            {errors.message && <p className="text-destructive text-sm">{errors.message.message}</p>}
          </div>
          <button
            type="submit"
            className="tech-button w-full"
            disabled={formStatus === "sending"}
          >
            {formStatus === "sending" ? "Transmitting..." : "Transmit Message"}
          </button>
        </form>
        {formStatus === "success" && (
          <p className="text-primary mt-4">Message transmitted successfully. Status: Pending developer review.</p>
        )}
        {formStatus === "error" && (
          <p className="text-destructive mt-4">Failed to transmit message. Please try again.</p>
        )}
      </section>
    </div>
  );
}