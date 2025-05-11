import { z } from "zod";

export const userSettingsSchema = z.object({
    id: z.string().uuid().optional(), // UUID or unique identifier
    address: z.string().max(255).optional(),
    phone_number: z.string().regex(/^\+?[0-9\s\-()]{7,15}$/).optional(),
    email: z.string().email().optional(),
    linkedin_url: z.string().url().optional(),
    github_url: z.string().url().optional(),
    website_1_url: z.string().optional(),
    website_2_url: z.string().optional(),
    about_me: z.string().optional(),
    about_short: z.string().optional(),
});