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
        }

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

  // Edit an existing devlog entry
  const editDevlogEntry = (entry: DevlogEntryForm) => {
    setCurrentDevlog({
      ...entry,
    });
    setDevlogContent(entry.content);
    // Remove the entry being edited from the list
    setDevlogEntries(devlogEntries.filter(e => e.id !== entry.id));
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
      className="flex flex-col gap-6 max-w-4xl mx-auto p-6 bg-white shadow-md rounded-md my-8"
    >
      <h1 className="text-2xl font-bold">Edit Project: {project?.title}</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-6">
          {/* Project Basic Info Section */}
          <div className="border p-4 rounded-md">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            
            {/* Title */}
            <div className="mb-4">
              <Label htmlFor="title">Title *</Label>
              <input
                id="title"
                {...register("title")}
                className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
              />
              {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
            </div>

            {/* Summary */}
            <div className="mb-4">
              <Label htmlFor="summary">Summary *</Label>
              <textarea
                id="summary"
                {...register("summary")}
                className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
                rows={3}
              />
              {errors.summary && <p className="text-red-500 text-sm">{errors.summary.message}</p>}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <input
                  id="start_date"
                  type="date"
                  {...register("start_date")}
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
                />
                {errors.start_date && (
                  <p className="text-red-500 text-sm">{errors.start_date.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="end_date">End Date (Optional)</Label>
                <input
                  id="end_date"
                  type="date"
                  {...register("end_date")}
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
                />
                {errors.end_date && (
                  <p className="text-red-500 text-sm">{errors.end_date.message}</p>
                )}
              </div>
            </div>

            {/* URLs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="repository_url">Repository URL</Label>
                <input
                  id="repository_url"
                  type="url"
                  {...register("repository_url")}
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
                />
                {errors.repository_url && (
                  <p className="text-red-500 text-sm">{errors.repository_url.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="demo_url">Demo URL</Label>
                <input
                  id="demo_url"
                  type="url"
                  {...register("demo_url")}
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
                />
                {errors.demo_url && (
                  <p className="text-red-500 text-sm">{errors.demo_url.message}</p>
                )}
              </div>
            </div>

            {/* Status & Featured */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Project Status</Label>
                <select
                  id="status"
                  {...register("status")}
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                {errors.status && (
                  <p className="text-red-500 text-sm">{errors.status.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 mt-6">
                <input
                  id="featured"
                  type="checkbox"
                  {...register("featured")}
                  className="h-4 w-4"
                />
                <Label htmlFor="featured">Featured Project</Label>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="border p-4 rounded-md">
            <h2 className="text-lg font-semibold mb-4">Project Description</h2>
            <div>
              <Label htmlFor="description">Description *</Label>
              <div className="border rounded focus-within:ring-2 focus-within:ring-primary focus-within:outline-none">
                <MarkdownEditor
                  value={description}
                  onChange={({ text }) => {
                    setDescription(text);
                    setValue("description", text);
                  }}
                  renderHTML={(text) => <ReactMarkdown>{text}</ReactMarkdown>}
                  config={{
                    view: {
                      menu: true,
                      md: true,
                      html: true,
                    },
                    canView: {
                      menu: true,
                      md: true,
                      html: true,
                    },
                  }}
                  className="markdown-editor"
                  style={{ height: '300px' }}
                />
              </div>
              {errors.description && (
                <p className="text-red-500 text-sm">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Gallery Images Section */}
          <div className="border p-4 rounded-md">
            <h2 className="text-lg font-semibold mb-4">Project Gallery</h2>
            
            <div className="mb-4">
              <Label htmlFor="gallery">Upload Images</Label>
              <input
                id="gallery"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can upload multiple images at once
              </p>
            </div>

            {/* Image preview area */}
            <div className="space-y-4 mt-4">
              {galleryImages.map((image) => (
                <div key={image.id} className="border p-3 rounded-md">
                  <div className="flex items-start gap-4">
                    {/* Image preview */}
                    <div className="w-24 h-24 relative">
                      {image.preview && (
                        <Image
                          loader={({ src }) => src}
                          src={image.preview}
                          alt="Preview"
                          fill
                          style={{ objectFit: 'cover' }}
                          className="rounded"
                        />
                      )}
                    </div>
                    
                    {/* Image metadata fields */}
                    <div className="flex-1 space-y-2">
                      <div>
                        <Label htmlFor={`alt-${image.id}`}>Alt Text *</Label>
                        <input
                          id={`alt-${image.id}`}
                          type="text"
                          value={image.alt_text}
                          onChange={(e) => updateImageMeta(image.id, 'alt_text', e.target.value)}
                          className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
                          placeholder="Describe the image for accessibility"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`caption-${image.id}`}>Caption</Label>
                        <input
                          id={`caption-${image.id}`}
                          type="text"
                          value={image.caption || ''}
                          onChange={(e) => updateImageMeta(image.id, 'caption', e.target.value)}
                          className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
                          placeholder="Optional caption"
                        />
                      </div>
                    </div>
                    
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Developer Logs Section */}
          <div className="border p-4 rounded-md">
            <h2 className="text-lg font-semibold mb-4">Developer Logs</h2>
            
            <div className="space-y-4 mb-4">
              <div>
                <Label htmlFor="devlog-title">Log Title</Label>
                <input
                  id="devlog-title"
                  value={currentDevlog.title}
                  onChange={(e) => setCurrentDevlog({...currentDevlog, title: e.target.value})}
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="e.g., Initial Setup, Added Feature X"
                />
              </div>
              
              <div>
                <Label htmlFor="devlog-date">Log Date</Label>
                <input
                  id="devlog-date"
                  type="date"
                  value={currentDevlog.entry_date}
                  onChange={(e) => setCurrentDevlog({...currentDevlog, entry_date: e.target.value})}
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              
              <div>
                <Label htmlFor="devlog-milestone">Milestone Type</Label>
                <select
                  id="devlog-milestone"
                  value={currentDevlog.milestone_type || ''}
                  onChange={(e) => setCurrentDevlog({
                    ...currentDevlog, 
                    milestone_type: e.target.value === '' ? null : e.target.value as 'major' | 'minor'
                  })}
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="">None</option>
                  <option value="minor">Minor Milestone</option>
                  <option value="major">Major Milestone</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="devlog-content">Log Content</Label>
                <div className="border rounded focus-within:ring-2 focus-within:ring-primary focus-within:outline-none">
                  <MarkdownEditor
                    value={devlogContent}
                    onChange={({ text }) => setDevlogContent(text)}
                    renderHTML={(text) => <ReactMarkdown>{text}</ReactMarkdown>}
                    config={{
                      view: {
                        menu: true,
                        md: true,
                        html: true,
                      },
                      canView: {
                        menu: true,
                        md: true,
                        html: true,
                      },
                    }}
                    className="markdown-editor"
                    style={{ height: '200px' }}
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={addDevlogEntry}
                className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
              >
                {currentDevlog.original_id ? 'Update Developer Log' : 'Add Developer Log'}
              </button>
            </div>
            
            {/* Added devlogs display */}
            {devlogEntries.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Developer Logs ({devlogEntries.length})</h3>
                <ul className="space-y-2">
                  {devlogEntries.map((entry) => (
                    <li key={entry.id} className="border p-2 rounded flex justify-between items-center">
                      <div>
                        <span className="font-medium">{entry.title}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {entry.entry_date}
                          {entry.milestone_type && (
                            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                              entry.milestone_type === 'major' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {entry.milestone_type} milestone
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editDevlogEntry(entry)}
                          className="text-blue-500 hover:text-blue-700 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDevlogEntry(entry.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Buttons */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={() => router.push("/admin/projects")}
          className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white py-2 px-4 rounded disabled:bg-blue-300 hover:bg-blue-700"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}