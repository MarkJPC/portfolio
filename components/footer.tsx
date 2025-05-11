"use client";

import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { Github, Linkedin } from "lucide-react";

interface FooterData {
  address: string;
  email: string;
  github_url: string;
  linkedin_url: string;
  phone_number: string;
  website_1_url: string;
  website_2_url?: string;
  about_short: string;
}

export default function Footer() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [footerData, setFooterData] = useState<FooterData | null>(null);

  useEffect(() => {
    const fetchFooterData = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("user_settings").select("*").single();

      if (error) {
        console.error("Error fetching footer data:", error);
        setError("Failed to load footer data. Please try again later.");
      } else {
        setFooterData(data);
      }
      setLoading(false);
    };

    fetchFooterData();
  }, []);

  if (loading) {
    return (
      <footer className="w-full flex items-center justify-center py-8 bg-muted text-muted-foreground">
        <p>Loading footer...</p>
      </footer>
    );
  }

  if (error) {
    return (
      <footer className="w-full flex items-center justify-center py-8 bg-muted text-destructive">
        <p>{error}</p>
      </footer>
    );
  }

  return (
    <footer className="w-full bg-card text-card-foreground border-t border-border py-8">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* First Column: About Me */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {/* Developer Icon */}
            <div className="bg-primary text-primary-foreground p-2 rounded-md">
              <span className="text-xl font-bold">{`</>`}</span>
            </div>
            {/* Name */}
            <h2 className="text-lg font-semibold">Mark Cena</h2>
          </div>
          {/* About Short */}
          <p className="text-sm text-muted-foreground">{footerData?.about_short}</p>
          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href={footerData?.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href={footerData?.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Second Column: Links */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tech-heading">Links</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/about" className="hover:underline">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:underline">
                Contact
              </Link>
            </li>
          </ul>

          <ul className="space-y-2">
            {footerData?.website_1_url && (
                <li>
                    <Link href={footerData?.website_1_url} className="hover:underline">
                        Website 1
                    </Link>
                </li>
            )}
          </ul>

          <ul className="space-y-2">
            {footerData?.website_2_url && (
                <li>
                    <Link href={footerData.website_2_url} className="hover:underline">
                        Website 2
                    </Link>
                </li>
            )}
          </ul>

            <ul className="space-y-2">
                <li>
                    {/* Resume Link */}
                    <Link href="/" className="hover:underline">
                        Resume
                    </Link>
                </li>
            </ul>
        </div>

        {/* Third Column: Projects by Category */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tech-heading">Projects</h2>
          <p className="text-sm text-muted-foreground">
            In the future, this section will display links to projects organized by category.
          </p>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="mt-8 border-t border-border pt-4 text-center text-sm text-muted-foreground">
        <p>
          Powered by{" "}
          <a
            href="https://supabase.com/"
            target="_blank"
            rel="noreferrer"
            className="font-bold hover:underline"
          >
            Supabase
          </a>{" "}
          and{" "}
          <a
            href="https://nextjs.org/"
            target="_blank"
            rel="noreferrer"
            className="font-bold hover:underline"
          >
            Next.js
          </a>
        </p>
      </div>
    </footer>
  );
}