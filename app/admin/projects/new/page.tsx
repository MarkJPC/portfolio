"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProjectSchema, CreateProjectInput, createDevlogEntrySchema } from "@/lib/schemas/schema";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";
import "react-markdown-editor-lite/lib/index.css"; // Import default styles for the editor
import ReactMarkdown from "react-markdown";
import { v4 as uuidv4 } from 'uuid';
import Image from "next/image";

// Dynamically import the Markdown editor
const MarkdownEditor = dynamic(() => import("react-markdown-editor-lite"), { ssr: false });

// Define types for gallery images and devlogs
interface GalleryImage {
  id: string;
  file: File;
  caption: string;
  alt_text: string;
  display_order: number;
  preview?: string;
}

interface DevlogEntry {
  id: string;
  title: string;
  content: string;
  entry_date: string;
  milestone_type: 'major' | 'minor' | null;
}

export default function ProjectForm() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState(""); // State for Markdown content
  
  // States for gallery and devlogs
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [devlogEntries, setDevlogEntries] = useState<DevlogEntry[]>([]);
  const [currentDevlog, setCurrentDevlog] = useState<DevlogEntry>({
    id: uuidv4(),
    title: "",
    content: "",
    entry_date: new Date().toISOString().split("T")[0],
    milestone_type: null
  });
  const [devlogContent, setDevlogContent] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: "",
      summary: "",
      description: "",
      start_date: new Date().toISOString().split("T")[0],
      status: "in_progress",
      featured: false,
    },
  });

  // Handle file selection for gallery
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    const newImages: GalleryImage[] = files.map((file, index) => {
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
    const onSubmit = async (data: CreateProjectInput) => {
        setLoading(true);
        setError(null);
    
        try {
        // Get the current user
        const { data: userData, error: userError } = await supabase.auth.getUser();
    
        if (userError) {
            console.error("Authentication error:", userError);
            throw new Error(`Authentication failed: ${userError.message}`);
        }
        
        if (!userData.user) {
            console.error("No user found");
            throw new Error("Not authenticated - please log in again");
        }
    
        console.log("User data:", userData.user);
    
        // STEP 1: Create the project
        try {
            const formattedData = {
            ...data,
            end_date: data.end_date === "" ? null : data.end_date,
            user_id: userData.user.id,
            };
            console.log("Creating project with data:", formattedData);
    
            const { data: projectData, error: projectError } = await supabase
            .from("projects")
            .insert(formattedData)
            .select('id')
            .single();
    
            if (projectError) {
                console.error("Project creation error:", projectError);
                throw new Error(`Project creation failed: ${projectError.message}`);
            }
    
            const projectId = projectData.id;
            console.log("Project created successfully with ID:", projectId);
    
            // STEP 2: Process gallery images
            if (galleryImages.length > 0) {
            try {
                console.log(`Processing ${galleryImages.length} gallery images`);
                const projectBucketPath = `projects/${projectId}`;
                
                for (const image of galleryImages) {
                    try {
                        const fileExt = image.file.name.split('.').pop();
                        const filePath = `${projectBucketPath}/${uuidv4()}.${fileExt}`;
                        
                        // Upload to storage
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
                            project_id: projectId,
                            image_url: publicUrlData.publicUrl,
                            storage_path: filePath,
                            caption: image.caption,
                            alt_text: image.alt_text,
                            display_order: image.display_order
                        };
                        
                        console.log("Creating gallery image record:", galleryData);
                        const { error: galleryError } = await supabase
                            .from('gallery_images')
                            .insert(galleryData);
                        
                        if (galleryError) {
                            console.error("Gallery record creation error:", galleryError);
                            throw new Error(`Gallery record creation failed: ${galleryError.message}`);
                        }
                    } catch (imageError: any) {
                        console.error(`Failed processing image ${image.file.name}:`, imageError);
                        throw new Error(`Image processing failed: ${imageError.message}`);
                    }
                }
                console.log("All gallery images processed successfully");
            } catch (galleryError: any) {
                console.error("Gallery processing error:", galleryError);
                throw new Error(`Gallery processing failed: ${galleryError.message}`);
            }
            }
            
            // STEP 3: Process devlog entries
            if (devlogEntries.length > 0) {
            try {
                console.log(`Processing ${devlogEntries.length} devlog entries`);
                const devlogsToInsert = devlogEntries.map(entry => ({
                project_id: projectId,
                title: entry.title,
                content: entry.content,
                entry_date: entry.entry_date,
                milestone_type: entry.milestone_type
                }));
                
                console.log("Creating devlog entries:", devlogsToInsert);
                const { error: devlogError } = await supabase
                .from('devlog_entries')
                .insert(devlogsToInsert);
                
                if (devlogError) {
                console.error("Devlog creation error:", devlogError);
                throw new Error(`Devlog creation failed: ${devlogError.message}`);
                }
                console.log("All devlog entries processed successfully");
            } catch (devlogError: any) {
                console.error("Devlog processing error:", devlogError);
                throw new Error(`Devlog processing failed: ${devlogError.message}`);
            }
            }
    
            console.log("Project creation completed successfully");
            router.push("/admin/projects");
            router.refresh();
        } catch (projectError: any) {
            throw projectError; // Re-throw to be caught by outer catch
        }
        } catch (err: any) {
        console.error("Error in form submission:", err);
        setError(err.message || "An error occurred");
        } finally {
        setLoading(false);
        }
    };

  useEffect(() => {
    if (description) {
      setValue("description", description);
    }
  }, [description, setValue]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 max-w-4xl mx-auto p-6 bg-white shadow-md rounded-md my-8"
    >
      <h1 className="text-2xl font-bold">Create Project</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              {galleryImages.map((image, index) => (
                <div key={image.id} className="border p-3 rounded-md">
                  <div className="flex items-start gap-4">
                    {/* Image preview */}
                    <div className="w-24 h-24 relative">
                      {image.preview && (
                        <Image
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
        </div>

        <div className="space-y-6">
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
                Add Developer Log
              </button>
            </div>
            
            {/* Added devlogs display */}
            {devlogEntries.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Added Developer Logs ({devlogEntries.length})</h3>
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
                      <button
                        type="button"
                        onClick={() => removeDevlogEntry(entry.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
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
          disabled={loading}
          className="bg-blue-600 text-white py-2 px-4 rounded disabled:bg-blue-300 hover:bg-blue-700"
        >
          {loading ? "Saving..." : "Create Project"}
        </button>
      </div>
    </form>
  );
}