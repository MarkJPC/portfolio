interface Project {
    id: string;
    title: string;
    slug: string;
    startDate: Date;
    endDate: Date | null; // null if ongoing
    category: string[]; // e.g., ["Web Development", "AI", "Mobile"]
    skills: string[]; // e.g., ["React", "TypeScript", "Supabase"]
    summary: string; // Brief overview
    description: string; // Detailed markdown content
    repositoryUrl?: string;
    demoUrl?: string;
    featured: boolean;
    status: "completed" | "in-progress" | "planned";
    gallery: {
      id: string;
      imageUrl: string;
      caption: string;
      order: number;
    }[];
    devlogs: DevlogEntry[];
}

interface DevlogEntry {
    id: string;
    projectId: string;
    title: string;
    date: Date;
    content: string; // Markdown content
    tags: string[]; // e.g., ["bug-fix", "feature", "learning"]
    milestoneType?: "major" | "minor"; // Optional flag for significant updates
}

interface Skill {
    id: string;
    name: string;
    category: "frontend" | "backend" | "database" | "ai" | "devops" | "other";
    proficiencyLevel: number; // 1-5 scale
    yearsExperience: number;
    firstUsedDate: Date;
    relatedProjects: string[]; // Project IDs
}

export type { Project, DevlogEntry, Skill };
