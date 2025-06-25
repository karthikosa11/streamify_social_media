import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadPost } from "../lib/api";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import useUploadMedia from "../hooks/useUploadMedia";

const MAX_CAPTION_LENGTH = 100;
const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function CreatePostPage() {
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const uploadMediaMutation = useUploadMedia();

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setError("Only image and video files are allowed.");
      setMedia(null);
      setMediaPreview(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size should not exceed ${MAX_FILE_SIZE_MB}MB.`);
      setMedia(null);
      setMediaPreview(null);
      return;
    }
    setError("");
    setMedia(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!media) {
      setError("Please select an image or video to upload.");
      return;
    }
    setUploading(true);
    try {
      // 1. Upload to Cloudinary
      const cloudinaryUrl = await uploadMediaMutation.mutateAsync(media);

      // 2. Send to backend
      await uploadPost({
        mediaUrl: cloudinaryUrl,
        caption,
      });

      toast.success("Post uploaded successfully!");
      setMedia(null);
      setMediaPreview(null);
      setCaption("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch (error) {
      toast.error("Failed to upload post");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-950">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-white text-center">Create a Post</h2>
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Upload Image or Video <span className="text-xs text-gray-400">(max {MAX_FILE_SIZE_MB}MB)</span></label>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaChange}
            className="block w-full text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80"
          />
          {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
        </div>
        {mediaPreview && (
          <div className="mb-4 relative">
            <button
              type="button"
              className="absolute top-2 right-2 bg-black bg-opacity-60 rounded-full p-1 text-white hover:bg-opacity-80 z-10"
              onClick={() => {
                setMedia(null);
                setMediaPreview(null);
                setError("");
              }}
              aria-label="Remove media"
            >
              <span style={{fontWeight: 'bold', fontSize: '1.2rem', lineHeight: 1}}>×</span>
            </button>
            {media && media.type.startsWith("image/") ? (
              <img src={mediaPreview} alt="Preview" className="w-full rounded-lg" />
            ) : (
              <video src={mediaPreview} controls className="w-full rounded-lg" />
            )}
          </div>
        )}
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Caption (optional)</label>
          <textarea
            value={caption}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CAPTION_LENGTH) setCaption(e.target.value);
            }}
            rows={2}
            className="w-full p-3 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:ring-2 focus:ring-primary"
            placeholder="Write a caption..."
          />
          <div className="text-right text-xs text-gray-400">
            {caption.length}/{MAX_CAPTION_LENGTH}
          </div>
        </div>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="btn btn-primary w-full mt-2 flex items-center justify-center"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload"
          )}
        </button>
      </div>
    </div>
  );
}
