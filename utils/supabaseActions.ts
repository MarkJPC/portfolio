"use server";

import { createClient } from "@/utils/supabase/client";
import { UserSettings } from "@/lib/types/settingTypes";

const supabase = createClient();

// fetch about me data from supabase
export const fetchAboutMe = async () => {
  const { data, error } = await supabase.from("user_settings").select("about_me").single();
  if (error) {
    console.error("Error fetching about me data:", error);
    return null;
  }
  return data.about_me;
};

// fetch projects data from supabase
export const fetchProjects = async () => {
  const { data, error } = await supabase.from("projects").select("*");
  if (error) {
    console.error("Error fetching projects data:", error);
    return null;
  }
  return data;
};

// fetch project data by id from supabase
export const fetchProjectById = async (id: string) => {
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
  if (error) {
    console.error("Error fetching project data:", error);
    return null;
  }
  return data;
};

// fetch socials data from supabase
export const fetchSocials = async () => {
  const { data, error } = await supabase.from("user_settings").select("phone_number, email, github_url, linkedin_url").single();
  if (error) {
    console.error("Error fetching socials data:", error);
    return null;
  }
  return data;
};

// fetch settings data from supabase
export const fetchSettings = async () => {
  const { data, error } = await supabase.from("user_settings").select("*").single();
  if (error) {
    console.error("Error fetching settings data:", error);
    return null;
  }
  return data;
};

// submit settings data to supabase
export const submitSettings = async (data: UserSettings) => {
  const { error } = await supabase
    .from("user_settings")
    .update(data)
    .eq("id", data.id);

  if (error) {
    console.error("Error submitting settings data:", error);
    return null;
  }
  return true;
};

// fetch skills
export const fetchSkills = async () => {
  const { data, error } = await supabase.from("skills").select("*");
  if (error) {
    console.error("Error fetching skills data:", error);
    return null;
  }
  return data;
};

// fetch project categories
export const fetchProjectCategories = async () => {
  const { data, error } = await supabase.from("project_categories").select("*");
  if (error) {
    console.error("Error fetching project categories data:", error);
    return null;
  }
  return data;
};

// fetch skill categories
export const fetchSkillCategories = async () => {
  const { data, error } = await supabase.from("skill_categories").select("*");
  if (error) {
    console.error("Error fetching skill categories data:", error);
    return null;
  }
  return data;
};

// create skill
export const createSkill = async (data: string) => {
    // check if skill already exists
    const { data: existingSkill, error: checkError } = await supabase
      .from("skills")
      .select("*")
      .eq("name", data)
      .single();
    if (checkError) {
      console.error("Error checking skill existence:", checkError);
      return null;
    }

    // if skill already exists, return null
    if (existingSkill) {
      console.log("Skill already exists:", existingSkill);
      return null;
    }

    
};

// create project
export const createProject = async (data: any) => {
  const { error } = await supabase.from("projects").insert(data);
  if (error) {
    console.error("Error creating project:", error);
    return null;
  }
  return true;
};
