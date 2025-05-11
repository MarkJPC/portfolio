import { z } from 'zod';

// Base schemas for shared fields
const baseSchema = z.object({
  id: z.string().uuid().optional(), // Optional for new entries
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// Skill Categories Schema
export const skillCategorySchema = baseSchema.extend({
  name: z.string().min(1, "Category name is required"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color code"),
});

export type SkillCategory = z.infer<typeof skillCategorySchema>;

// Skills Schema
export const skillSchema = baseSchema.extend({
  name: z.string().min(1, "Skill name is required"),
  category_id: z.string().uuid("Must be a valid category ID"),
  proficiency_level: z.number().int().min(1).max(5),
  years_experience: z.number().positive().max(100),
  first_used_date: z.string(), // Format: YYYY-MM-DD
  icon_name: z.string().optional(),
});

export type Skill = z.infer<typeof skillSchema>;

// Project Status Enum
export const projectStatusEnum = z.enum(['planned', 'in_progress', 'completed']);
export type ProjectStatus = z.infer<typeof projectStatusEnum>;

// Projects Schema
export const projectSchema = baseSchema.extend({
  title: z.string().min(1, "Project title is required"),
  slug: z.string().min(1).optional(), // Optional as it's auto-generated
  summary: z.string().min(1, "Project summary is required"),
  description: z.string().min(1, "Project description is required"),
  start_date: z.string(), // Format: YYYY-MM-DD
  end_date: z.string().optional(), // Optional for ongoing projects
  repository_url: z.string().url("Must be a valid URL").optional(),
  demo_url: z.string().url("Must be a valid URL").optional(),
  featured: z.boolean().default(false),
  status: projectStatusEnum.default('in_progress'),
});

export type Project = z.infer<typeof projectSchema>;

// Project Categories Schema
export const projectCategorySchema = baseSchema.extend({
  name: z.string().min(1, "Category name is required"),
});

export type ProjectCategory = z.infer<typeof projectCategorySchema>;

// Project-Category Junction Schema
export const projectCategoryMapSchema = z.object({
  project_id: z.string().uuid(),
  category_id: z.string().uuid(),
  created_at: z.string().datetime().optional(),
});

export type ProjectCategoryMap = z.infer<typeof projectCategoryMapSchema>;

// Project-Skill Junction Schema
export const projectSkillMapSchema = z.object({
  project_id: z.string().uuid(),
  skill_id: z.string().uuid(),
  created_at: z.string().datetime().optional(),
});

export type ProjectSkillMap = z.infer<typeof projectSkillMapSchema>;

// Gallery Images Schema
export const galleryImageSchema = baseSchema.extend({
  project_id: z.string().uuid(),
  image_url: z.string().url("Must be a valid URL"),
  storage_path: z.string(),
  caption: z.string().optional(),
  alt_text: z.string().min(1, "Alt text is required for accessibility"),
  display_order: z.number().int().nonnegative(),
});

export type GalleryImage = z.infer<typeof galleryImageSchema>;

// Devlog Entries Schema
export const devlogEntrySchema = baseSchema.extend({
  project_id: z.string().uuid(),
  title: z.string().min(1, "Entry title is required"),
  content: z.string().min(1, "Entry content is required"),
  entry_date: z.string(), // Format: YYYY-MM-DD
  milestone_type: z.enum(['major', 'minor']).optional(),
});

export type DevlogEntry = z.infer<typeof devlogEntrySchema>;

// Tags Schema
export const tagSchema = baseSchema.extend({
  name: z.string().min(1, "Tag name is required"),
});

export type Tag = z.infer<typeof tagSchema>;

// Devlog-Tag Junction Schema
export const devlogTagMapSchema = z.object({
  devlog_id: z.string().uuid(),
  tag_id: z.string().uuid(),
  created_at: z.string().datetime().optional(),
});

export type DevlogTagMap = z.infer<typeof devlogTagMapSchema>;

// Form submission schemas (for create/update operations)
// Create Project Schema - define exactly what fields are required for creation
export const createProjectSchema = z.object({
  title: z.string().min(1, "Project title is required"),
  summary: z.string().min(1, "Project summary is required"),
  description: z.string().min(1, "Project description is required"),
  start_date: z.string(), // Format: YYYY-MM-DD
  end_date: z.string().optional(), // Optional for ongoing projects
  repository_url: z.string().url("Must be a valid URL").optional(),
  demo_url: z.string().url("Must be a valid URL").optional(),
  featured: z.boolean(),
  status: projectStatusEnum,
  slug: z.string().min(1).optional(), // Optional as it's auto-generated
});

// Update Project Schema - all fields optional for patching
export const updateProjectSchema = createProjectSchema.partial();

// Export the types
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const createSkillSchema = z.object({
  name: z.string().min(1, "Skill name is required"),
  category_id: z.string().uuid("Must be a valid category ID"),
  proficiency_level: z.number().int().min(1).max(5),
  years_experience: z.number().positive().max(100),
  first_used_date: z.string(), // Format: YYYY-MM-DD
  icon_name: z.string().optional(),
});

export const updateSkillSchema = createSkillSchema.partial();

export const createDevlogEntrySchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(1, "Entry title is required"),
  content: z.string().min(1, "Entry content is required"),
  entry_date: z.string(), // Format: YYYY-MM-DD
  milestone_type: z.enum(['major', 'minor']).optional(),
});

export const updateDevlogEntrySchema = createDevlogEntrySchema.partial();

// Extended schema for project with relations
export const projectWithRelationsSchema = projectSchema.extend({
  categories: z.array(projectCategorySchema).optional(),
  skills: z.array(skillSchema).optional(),
  gallery: z.array(galleryImageSchema).optional(),
  devlog: z.array(devlogEntrySchema).optional(),
});

export type ProjectWithRelations = z.infer<typeof projectWithRelationsSchema>;