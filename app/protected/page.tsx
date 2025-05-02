import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12 p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-accent p-4 rounded-md shadow-md">
          <h2 className="text-xl font-semibold">Projects</h2>
          <p className="text-sm text-secondary-foreground mt-2">
            Manage your portfolio projects.
          </p>
          <Link
            href="/admin/projects"
            className="mt-4 inline-block text-primary underline"
          >
            Go to Projects
          </Link>
        </div>

        <div className="bg-accent p-4 rounded-md shadow-md">
          <h2 className="text-xl font-semibold">Skills</h2>
          <p className="text-sm text-secondary-foreground mt-2">
            Update your technical skills.
          </p>
          <Link
            href="/admin/skills"
            className="mt-4 inline-block text-primary underline"
          >
            Go to Skills
          </Link>
        </div>

        <div className="bg-accent p-4 rounded-md shadow-md">
          <h2 className="text-xl font-semibold">Media Library</h2>
          <p className="text-sm text-secondary-foreground mt-2">
            Manage your uploaded images.
          </p>
          <Link
            href="/admin/media"
            className="mt-4 inline-block text-primary underline"
          >
            Go to Media Library
          </Link>
        </div>
      </section>
    </div>
  );
}
