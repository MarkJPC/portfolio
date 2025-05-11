"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase.from("projects").select("*");

      if (error) {
        console.error("Error fetching projects:", error);
        setError("Failed to load projects. Please try again later.");
      } else {
        setProjects(data || []);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="p-6 bg-background text-foreground min-h-screen">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <header className="mb-6 mx-auto">
                <h1 className="text-3xl font-bold tech-heading">Projects</h1>
                <Link
                href="/admin/projects/new"
                className="mt-4 inline-block bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-tech hover:bg-primary/90 transition-all duration-300"
                >
                Create New Project
                </Link>
            </header>

            {loading ? (
                <div className="text-center text-muted-foreground">Loading...</div>
            ) : error ? (
                <div className="text-center text-destructive">{error}</div>
            ) : (
                <section className="tech-grid">
                {projects.map((project) => (
                    <div
                    key={project.id}
                    className="tech-card bg-card text-card-foreground p-4 rounded-md shadow-md hover:shadow-tech-lg transition-shadow duration-300"
                    >
                    <h2 className="text-xl font-semibold tech-heading">{project.title}</h2>
                    <p className="mt-2 text-muted-foreground">{project.summary}</p>
                    <div className="mt-4 flex gap-4">
                        <Link
                        href={`/admin/projects/${project.id}`}
                        className="tech-button bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                        Edit
                        </Link>
                        <button
                        className="tech-button bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={async () => {
                            const supabase = createClient();
                            const { error } = await supabase
                            .from("projects")
                            .delete()
                            .eq("id", project.id);

                            if (error) {
                            console.error("Error deleting project:", error);
                            } else {
                            setProjects((prev) => prev.filter((p) => p.id !== project.id));
                            }
                        }}
                        >
                        Delete
                        </button>
                    </div>
                    </div>
                ))}
                </section>
            )}
        </div>
    </div>
  );
}