"use client";

import { use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProjectSchema, UpdateProjectInput, projectWithRelationsSchema, ProjectWithRelations } from "@/lib/schemas/schema";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import dynamic from "next/dynamic";
import "react-markdown-editor-lite/lib/index.css";
import ReactMarkdown from "react-markdown";
import { v4 as uuidv4 } from 'uuid';
import Image from "next/image";

// Dynamically import the Markdown editor
const MarkdownEditor = dynamic(() => import("react-markdown-editor-lite"), { ssr: false });

// Define types for gallery images and devlogs for the form
interface GalleryImageForm {
  id: string;
  file?: File;
  caption: string;
  alt_text: string;
  display_order: number;
  preview?: string;
  image_url?: string; // Existing image URL
  storage_path?: string; // Existing storage path
}

interface DevlogEntryForm {
  id: string;
  title: string;
  content: string;
  entry_date: string;
  milestone_type: 'major' | 'minor' | null;
  original_id?: string; // To track existing entries from database
}

export default function ProjectEditForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [galleryImages, setGalleryImages] = useState<GalleryImageForm[]>([]);
  const [devlogEntries, setDevlogEntries] = useState<DevlogEntryForm[]>([]);
  const [currentDevlog, setCurrentDevlog] = useState<DevlogEntryForm>({
    id: uuidv4(),
    title: "",
    content: "",
    entry_date: new Date().toISOString().split("T")[0],
    milestone_type: null
  });
  const [devlogContent, setDevlogContent] = useState("");
  const [project, setProject] = useState<ProjectWithRelations | null>(null);
  const [editingDevlogId, setEditingDevlogId] = useState<string | null>(null);
  const [editingDevlog, setEditingDevlog] = useState<Partial<DevlogEntryForm>>({}); 

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<UpdateProjectInput>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      title: "",
      summary: "",
      description: "",
      start_date: "",
      end_date: "",
      repository_url: "",
      demo_url: "",
      status: "in_progress",
      featured: false,
    },
  });

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch project
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .single();

        if (projectError) {
          throw new Error(`Failed to fetch project: ${projectError.message}`);
        }

        if (!projectData) {
          throw new Error("Project not found");
        } else {
          console.log("Fetched project data:", projectData);
        }

        // Fetch gallery images
        const { data: galleryData, error: galleryError } = await supabase
          .from("gallery_images")
          .select("*")
          .eq("project_id", id)
          .order("display_order", { ascending: true });

        if (galleryError) {
          console.error("Error fetching gallery images:", galleryError);
        }

        // Fetch devlog entries
        const { data: devlogData, error: devlogError } = await supabase
          .from("devlog_entries")
          .select("*")
          .eq("project_id", id)
          .order("entry_date", { ascending: false });

        if (devlogError) {
          console.error("Error fetching devlog entries:", devlogError);
        } else {
          console.log("Fetched devlog entries:", devlogData, id);
        }
        console.log("Project ID used for query:", id);
        console.log("Project ID type:", typeof id);

        // Set project data to state and form
        setProject({
          ...projectData,
          gallery: galleryData || [],
          devlog: devlogData || []
        });
        
        // Initialize form with project data
        reset({
          title: projectData.title,
          summary: projectData.summary,
          description: projectData.description,
          start_date: projectData.start_date,
          end_date: projectData.end_date || "",
          repository_url: projectData.repository_url || "",
          demo_url: projectData.demo_url || "",
          status: projectData.status,
          featured: projectData.featured,
        });
        
        // Set description for markdown editor
        setDescription(projectData.description);
        
        // Set gallery images
        if (galleryData) {
          setGalleryImages(galleryData.map(img => ({
            id: img.id,
            caption: img.caption || "",
            alt_text: img.alt_text,
            display_order: img.display_order,
            image_url: img.image_url,
            storage_path: img.storage_path,
            preview: img.image_url
          })));
        }
        
        // Set devlog entries
        if (devlogData) {
          setDevlogEntries(devlogData.map(entry => ({
            id: entry.id,
            original_id: entry.id, // To track existing entries
            title: entry.title,
            content: entry.content,
            entry_date: entry.entry_date,
            milestone_type: entry.milestone_type
          })));
        }

      } catch (err: any) {
        setError(err.message || "Failed to load project data");
        console.error("Error loading project:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, reset, supabase]);

  // Handle file selection for gallery
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    const newImages: GalleryImageForm[] = files.map((file, index) => {
      return {
        id: uuidv4(),
        file,
        caption: "",
        alt_text: file.name.split('.')[0], // Use filename as default alt text
        display_order: galleryImages.length + index,
        preview: URL.createObjectURL(file)
      };
    });
    
    setGalleryImages([...galleryImages, ...newImages]);
  };

  // Remove image from gallery
  const removeImage = (id: string) => {
    const updatedImages = galleryImages.filter(img => img.id !== id);
    // Update display order after removal
    const reorderedImages = updatedImages.map((img, index) => ({
      ...img,
      display_order: index
    }));
    setGalleryImages(reorderedImages);
  };

  // Update image caption or alt text
  const updateImageMeta = (id: string, field: 'caption' | 'alt_text', value: string) => {
    setGalleryImages(galleryImages.map(img => 
      img.id === id ? { ...img, [field]: value } : img
    ));
  };

  // Add a new devlog entry
  const addDevlogEntry = () => {
    // Validate devlog entry
    if (!currentDevlog.title || !devlogContent) {
      alert("Please fill out both title and content for the devlog entry");
      return;
    }

    setDevlogEntries([...devlogEntries, { ...currentDevlog, content: devlogContent }]);
    
    // Reset for the next entry
    setCurrentDevlog({
      id: uuidv4(),
      title: "",
      content: "",
      entry_date: new Date().toISOString().split("T")[0],
      milestone_type: null
    });
    setDevlogContent("");
  };

  // Remove a devlog entry
  const removeDevlogEntry = (id: string) => {
    setDevlogEntries(devlogEntries.filter(entry => entry.id !== id));
  };

  // Handle form submission
  const onSubmit = async (data: UpdateProjectInput) => {
    setSaving(true);
    setError(null);

    try {
      // Get the current user
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(`Authentication failed: ${userError.message}`);
      }
      
      if (!userData.user) {
        throw new Error("Not authenticated - please log in again");
      }

      console.log("Updating project with data:", data);

      // STEP 1: Update the project
      const { error: projectError } = await supabase
        .from("projects")
        .update({
          ...data,
          end_date: data.end_date === "" ? null : data.end_date,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (projectError) {
        throw new Error(`Failed to update project: ${projectError.message}`);
      }

      console.log("Project updated successfully");

      // STEP 2: Handle new gallery images
      const newImages = galleryImages.filter(img => img.file);
      if (newImages.length > 0) {
        try {
          console.log(`Processing ${newImages.length} new gallery images`);
          const projectBucketPath = `projects/${id}`;
          
          for (const image of newImages) {
            if (!image.file) continue;

            // Upload to storage
            const fileExt = image.file.name.split('.').pop();
            const filePath = `${projectBucketPath}/${uuidv4()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('images')
              .upload(filePath, image.file);
            
            if (uploadError) {
              console.error(`Image upload error for ${image.file.name}:`, uploadError);
              throw new Error(`Image upload failed: ${uploadError.message}`);
            }
            
            // Get public URL for the image
            const { data: publicUrlData } = supabase.storage
              .from('images')
              .getPublicUrl(filePath);
            
            // Create gallery image record
            const galleryData = {
              project_id: id,
              image_url: publicUrlData.publicUrl,
              storage_path: filePath,
              caption: image.caption,
              alt_text: image.alt_text,
              display_order: image.display_order
            };
            
            const { error: galleryError } = await supabase
              .from('gallery_images')
              .insert(galleryData);
            
            if (galleryError) {
              throw new Error(`Gallery record creation failed: ${galleryError.message}`);
            }
          }
          console.log("All new gallery images processed successfully");
        } catch (galleryError: any) {
          console.error("Gallery processing error:", galleryError);
          throw new Error(`Gallery processing failed: ${galleryError.message}`);
        }
      }

      // STEP 3: Update existing gallery images (captions, alt_text)
      const existingImages = galleryImages.filter(img => !img.file && img.image_url);
      for (const image of existingImages) {
        const { error: updateError } = await supabase
          .from('gallery_images')
          .update({
            caption: image.caption,
            alt_text: image.alt_text,
            display_order: image.display_order,
          })
          .eq('id', image.id);
        
        if (updateError) {
          console.error(`Failed to update gallery image ${image.id}:`, updateError);
        }
      }

      // STEP 4: Delete removed gallery images
      if (project?.gallery) {
        const currentImageIds = galleryImages.map(img => img.id);
        const removedImages = project.gallery.filter(img => img.id && !currentImageIds.includes(img.id));
        
        for (const image of removedImages) {
          // Delete from storage if we have the path
          if (image.storage_path) {
            await supabase.storage
              .from('images')
              .remove([image.storage_path])
              .then(({ error }) => {
                if (error) console.error(`Failed to delete image from storage: ${image.storage_path}`, error);
              });
          }
          
          // Delete from database
          const { error: deleteError } = await supabase
            .from('gallery_images')
            .delete()
            .eq('id', image.id);
          
          if (deleteError) {
            console.error(`Failed to delete gallery image record ${image.id}:`, deleteError);
          }
        }
      }

      // STEP 5: Process new devlog entries
      const newDevlogs = devlogEntries.filter(entry => !entry.original_id);
      if (newDevlogs.length > 0) {
        try {
          console.log(`Processing ${newDevlogs.length} new devlog entries`);
          const devlogsToInsert = newDevlogs.map(entry => ({
            project_id: id,
            title: entry.title,
            content: entry.content,
            entry_date: entry.entry_date,
            milestone_type: entry.milestone_type
          }));
          
          const { error: devlogError } = await supabase
            .from('devlog_entries')
            .insert(devlogsToInsert);
          
          if (devlogError) {
            throw new Error(`Devlog creation failed: ${devlogError.message}`);
          }
          console.log("All new devlog entries processed successfully");
        } catch (devlogError: any) {
          console.error("Devlog processing error:", devlogError);
          throw new Error(`Devlog processing failed: ${devlogError.message}`);
        }
      }

      // STEP 6: Update existing devlog entries
      const existingDevlogs = devlogEntries.filter(entry => entry.original_id);
      console.log("Existing devlog entries to update:", existingDevlogs);
      for (const entry of existingDevlogs) {
        const { error: updateError } = await supabase
          .from('devlog_entries')
          .update({
            title: entry.title,
            content: entry.content,
            entry_date: entry.entry_date,
            milestone_type: entry.milestone_type,
          })
          .eq('id', entry.original_id);
        
        if (updateError) {
          console.error(`Failed to update devlog entry ${entry.original_id}:`, updateError);
        }
      }

      // STEP 7: Delete removed devlog entries
      if (project?.devlog) {
        const currentDevlogIds = devlogEntries
          .filter(entry => entry.original_id)
          .map(entry => entry.original_id);
        
        const removedDevlogs = project.devlog.filter(entry => 
          !currentDevlogIds.includes(entry.id)
        );
        
        for (const entry of removedDevlogs) {
          const { error: deleteError } = await supabase
            .from('devlog_entries')
            .delete()
            .eq('id', entry.id);
          
          if (deleteError) {
            console.error(`Failed to delete devlog entry ${entry.id}:`, deleteError);
          }
        }
      }

      console.log("Project update completed successfully");
      router.push("/admin/projects");
    } catch (err: any) {
      console.error("Error in form submission:", err);
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    // Update the description value in the form whenever it changes
    if (description) {
      setValue("description", description);
    }
  }, [description, setValue]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading project data...</div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 max-w-4xl mx-auto p-6 bg-card text-card-foreground shadow-tech rounded-md my-8"
    >
      <h1 className="text-2xl font-bold tech-heading">Edit Project: {project?.title}</h1>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="tech-border">
            <h2 className="text-lg font-semibold mb-4 tech-heading">Basic Information</h2>
            <div className="mb-4 grid grid-cols-1 gap-4">
              <Label htmlFor="title">Title *</Label>
              <input
                id="title"
                {...register("title")}
                className="tech-input"
              />
              {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
            </div>
            <div className="mb-4 grid grid-cols-1 gap-4">
              <Label htmlFor="summary">Summary *</Label>
              <textarea
                id="summary"
                {...register("summary")}
                className="tech-input"
                rows={3}
              />
              {errors.summary && <p className="text-destructive text-sm">{errors.summary.message}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <input
                  id="start_date"
                  type="date"
                  {...register("start_date")}
                  className="tech-input"
                />
                {errors.start_date && <p className="text-destructive text-sm">{errors.start_date.message}</p>}
              </div>
              <div>
                <Label htmlFor="end_date">End Date (Optional)</Label>
                <input
                  id="end_date"
                  type="date"
                  {...register("end_date")}
                  className="tech-input"
                />
                {errors.end_date && <p className="text-destructive text-sm">{errors.end_date.message}</p>}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="tech-border">
            <h2 className="text-lg font-semibold mb-4 tech-heading">Description</h2>
            <div>
              <Label htmlFor="description">Description *</Label>
              <div className="tech-input">
                <MarkdownEditor
                  value={description}
                  onChange={({ text }) => setDescription(text)}
                  renderHTML={(text) => <ReactMarkdown>{text}</ReactMarkdown>}
                  className="markdown-editor"
                  style={{ height: "300px" }}
                />
              </div>
              {errors.description && <p className="text-destructive text-sm">{errors.description.message}</p>}
            </div>
          </div>

          {/* Gallery */}
          <div className="tech-border">
            <h2 className="text-lg font-semibold mb-4 tech-heading">Gallery</h2>
            <input
              id="gallery"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="tech-input"
            />
            <div className="space-y-4 mt-4">
              {galleryImages.map((image) => (
                <div key={image.id} className="border p-3 rounded-md flex items-start gap-4">
                  <div className="w-24 h-24 relative">
                    {image.preview && (
                      <Image
                        loader={({ src }) => src}
                        src={image.preview}
                        alt="Preview"
                        fill
                        style={{ objectFit: "cover" }}
                        className="rounded"
                      />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={image.alt_text}
                      onChange={(e) => updateImageMeta(image.id, "alt_text", e.target.value)}
                      className="tech-input"
                      placeholder="Alt Text"
                    />
                    <input
                      type="text"
                      value={image.caption}
                      onChange={(e) => updateImageMeta(image.id, "caption", e.target.value)}
                      className="tech-input"
                      placeholder="Caption"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Developer Logs */}
          <div className="tech-border">
            <h2 className="text-lg font-semibold mb-4 tech-heading">Developer Logs</h2>
            <div className="space-y-4 flex flex-col gap-4">
              <input
                type="text"
                value={currentDevlog.title}
                onChange={(e) => setCurrentDevlog({ ...currentDevlog, title: e.target.value })}
                className="tech-input"
                placeholder="Log Title"
              />
              <textarea
                value={devlogContent}
                onChange={(e) => setDevlogContent(e.target.value)}
                className="tech-input"
                placeholder="Log Content"
              />
              <button
                type="button"
                onClick={addDevlogEntry}
                className="tech-button bg-primary"
              >
                Add Log
              </button>
            </div>

            {devlogEntries.length > 0 ? (
              <div className="space-y-4">
                {devlogEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="border p-4 rounded-md flex flex-col gap-2 bg-muted/10"
                  >
                    {editingDevlogId === entry.id ? (
                      <>
                        <input
                          type="text"
                          value={editingDevlog.title ?? ""}
                          onChange={e => setEditingDevlog(ed => ({ ...ed, title: e.target.value }))}
                          className="tech-input mb-2"
                          placeholder="Log Title"
                        />
                        <textarea
                          value={editingDevlog.content ?? ""}
                          onChange={e => setEditingDevlog(ed => ({ ...ed, content: e.target.value }))}
                          className="tech-input mb-2"
                          placeholder="Log Content"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="tech-button bg-primary"
                            onClick={() => {
                              setDevlogEntries(devlogEntries.map(d =>
                                d.id === entry.id
                                  ? { ...d, title: editingDevlog.title ?? d.title, content: editingDevlog.content ?? d.content }
                                  : d
                              ));
                              setEditingDevlogId(null);
                              setEditingDevlog({});
                            }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="tech-button bg-muted text-muted-foreground"
                            onClick={() => {
                              setEditingDevlogId(null);
                              setEditingDevlog({});
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium text-lg">{entry.title}</h3>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDevlogId(entry.id);
                                setEditingDevlog({ title: entry.title, content: entry.content });
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removeDevlogEntry(entry.id)}
                              className="text-destructive hover:text-destructive/80"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{entry.entry_date}</p>
                        <p className="text-sm">{entry.content}</p>
                        {entry.milestone_type && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {entry.milestone_type === "major" ? "Major Milestone" : "Minor Milestone"}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No developer logs added yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={() => router.push("/admin/projects")}
          className="tech-button bg-muted text-muted-foreground hover:bg-muted/80"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="tech-button bg-primary"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}