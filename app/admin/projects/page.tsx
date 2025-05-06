"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("projects").select("*");

      if (error) {
        console.error("Error fetching projects:", error);
      } else {
        setProjects(data || []);
      }
    };

    fetchProjects();
  }, []);

    // if projects is still empty, use placeholder data
    if (projects.length === 0) {
    setProjects([
        {
        id: "1",
        title: "Project 1",
        summary: "This is a summary of Project 1.",
        },
        {
        id: "2",
        title: "Project 2",
        summary: "This is a summary of Project 2.",
        },
    ]);
    }

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link
          href="/admin/projects/new"
          className="mt-4 inline-block bg-primary text-white px-4 py-2 rounded-md"
        >
          Create New Project
        </Link>
      </header>

      <section>
        {projects.map((project) => (
          <div key={project.id} className="bg-accent p-4 rounded-md shadow-md mb-4">
            <h2 className="text-xl font-semibold">{project.title}</h2>
            <p className="text-sm text-secondary-foreground mt-2">{project.summary}</p>
            <div className="mt-4 flex gap-4">
              <Link
                href={`/admin/projects/${project.id}`}
                className="text-primary underline"
              >
                Edit
              </Link>
              <button
                className="text-red-500 underline"
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
    </div>
  );
}