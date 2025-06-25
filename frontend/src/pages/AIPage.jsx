import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";
import { FaRobot, FaImage, FaVideo, FaSpinner, FaUpload, FaTrash, FaTimes } from "react-icons/fa";
import { Loader2 } from "lucide-react";

const AIPage = () => {
  const [prompt, setPrompt] = useState("");
  const [generatedContent, setGeneratedContent] = useState(null);
  const [mediaType, setMediaType] = useState("image"); // image or video
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const MAX_CAPTION_LENGTH = 50;

  const generateContent = useMutation({
    mutationFn: async (data) => {
      const response = await axiosInstance.post("/ai/generate-post", data);
      return response.data;
    },
    onSuccess: (data) => {
      // Only prepend backend URL if mediaUrl is a relative path
      let mediaUrl = data.mediaUrl;
      if (mediaUrl && !/^https?:\/\//i.test(mediaUrl)) {
        mediaUrl = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}${mediaUrl}`;
      }
      setGeneratedContent({
        mediaUrl,
        type: data.type,
        originalUrl: data.mediaUrl // Store the original URL for deletion
      });
      setLoading(false); // Reset loading state
      toast.success(`${data.type === 'video' ? 'Video' : 'Image'} generated successfully!`);
    },
    onError: (error) => {
      setLoading(false); // Reset loading state on error
      toast.error(error.response?.data?.message || `Failed to generate ${mediaType}`);
    },
  });

  const uploadToPost = useMutation({
    mutationFn: async (data) => {
      const response = await axiosInstance.post("/posts", {
        mediaUrl: data.mediaUrl,
        caption: data.caption
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Post uploaded successfully!");
      setGeneratedContent(null);
      setCaption("");
      setUploading(false); // Reset uploading state
    },
    onError: (error) => {
      setUploading(false); // Reset uploading state on error
      toast.error(error.response?.data?.message || "Failed to upload to posts");
    },
  });

  const deleteGeneratedMedia = useMutation({
    mutationFn: async (data) => {
      const response = await axiosInstance.delete("/ai/delete-media", {
        data: { mediaUrl: data.mediaUrl }
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Generated content deleted successfully!");
      setGeneratedContent(null);
      setCaption("");
      setDeleting(false); // Reset deleting state
      setLoading(false); // Reset loading state when content is deleted
    },
    onError: (error) => {
      setDeleting(false); // Reset deleting state on error
      toast.error(error.response?.data?.message || "Failed to delete generated content");
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setLoading(true);
    generateContent.mutate({
      prompt,
      mediaType: "image" // Force image generation for now
    });
  };

  const handleUpload = () => {
    if (!generatedContent?.mediaUrl) {
      toast.error(`No image to upload`);
      return;
    }

    setUploading(true);
    const truncatedCaption = caption.slice(0, MAX_CAPTION_LENGTH);
    uploadToPost.mutate({
      mediaUrl: generatedContent.mediaUrl,
      caption: truncatedCaption
    });
  };

  const handleCancel = () => {
    if (!generatedContent?.originalUrl) {
      toast.error("No generated content to delete");
      return;
    }

    setDeleting(true);
    deleteGeneratedMedia.mutate({
      mediaUrl: generatedContent.originalUrl
    });
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-950">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-white text-center">AI Image Generator</h2>
        
        {/* Media Type Selection - Commented out for now */}
        {/* 
        <div className="mb-6">
          <label className="block text-gray-300 mb-2">Select Content Type</label>
          <div className="flex gap-4">
            <button
              onClick={() => setMediaType("image")}
              className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 ${
                mediaType === "image" ? "bg-primary text-white" : "bg-gray-800 text-gray-300"
              }`}
            >
              <FaImage />
              Image
            </button>
            <button
              onClick={() => setMediaType("video")}
              className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 ${
                mediaType === "video" ? "bg-primary text-white" : "bg-gray-800 text-gray-300"
              }`}
            >
              <FaVideo />
              Video
            </button>
          </div>
        </div>
        */}

        {/* Prompt Input */}
        <div className="mb-6">
          <label className="block text-gray-300 mb-2">Enter your prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="w-full p-3 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:ring-2 focus:ring-primary"
            rows={3}
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="btn btn-primary w-full mb-6"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FaRobot className="w-5 h-5 mr-2" />
              Generate Image
            </>
          )}
        </button>

        {/* Generated Content Preview */}
        {generatedContent && (
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden">
              {/* Video support commented out for now */}
              {/*
              {generatedContent.type === "video" ? (
                <video
                  src={generatedContent.mediaUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
              */}
                <img
                  src={generatedContent.mediaUrl}
                  alt={prompt}
                  className="w-full h-full object-cover"
                />
              {/* )} */}
              
              {/* Cancel/Delete Button */}
              <button
                onClick={handleCancel}
                disabled={deleting}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-colors"
                title="Delete generated content"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FaTimes className="w-4 h-4" />
                )}
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="mt-4">
                <label htmlFor="caption" className="block text-sm font-medium text-gray-300 mb-2">
                  Add a short caption (max {MAX_CAPTION_LENGTH} characters)
                </label>
                <div className="relative">
                  <textarea
                    id="caption"
                    value={caption}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_CAPTION_LENGTH) {
                        setCaption(e.target.value);
                      }
                    }}
                    placeholder="Add a short caption..."
                    className="w-full p-3 border rounded-lg bg-gray-800 text-gray-100 border-gray-700 focus:ring-2 focus:ring-primary"
                    rows={2}
                  />
                  <div className="absolute bottom-2 right-2 text-sm text-gray-500">
                    {caption.length}/{MAX_CAPTION_LENGTH}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={deleting}
                  className="flex-1 btn btn-outline btn-error"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FaTrash className="w-4 h-4 mr-2" />
                      Cancel & Delete
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 btn btn-primary"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FaUpload className="w-4 h-4 mr-2" />
                      Upload to Feed
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPage; 