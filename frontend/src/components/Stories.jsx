import { useState, useEffect } from "react";
import { PlusIcon, Loader2Icon } from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";
import StoryViewer from "./StoryViewer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createStory, getStories, deleteStory } from "../lib/api";
import toast from "react-hot-toast";

// Helper to group stories by user and merge items
function groupStoriesByUser(stories) {
  const userMap = new Map();
  for (const story of stories) {
    const userId = story.user._id;
    if (!userMap.has(userId)) {
      userMap.set(userId, { ...story, items: [...story.items] });
    } else {
      // Merge items without mutating the existing array
      const prev = userMap.get(userId);
      userMap.set(userId, {
        ...prev,
        items: [...prev.items, ...story.items],
      });
    }
  }
  return Array.from(userMap.values());
}

const Stories = () => {
  const { authUser } = useAuthUser();
  const [selectedStory, setSelectedStory] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  // Track seen stories in localStorage (by user._id)
  const getSeenStories = () => {
    try {
      return JSON.parse(localStorage.getItem("seenStoriesByUser") || "[]");
    } catch {
      return [];
    }
  };
  const setSeenStories = (ids) => {
    localStorage.setItem("seenStoriesByUser", JSON.stringify(ids));
  };
  const seenStories = getSeenStories();

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: getStories,
  });

  // Group stories by user and merge items
  const groupedStories = groupStoriesByUser(stories);

  const { mutate: uploadStory } = useMutation({
    mutationFn: createStory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast.success("Story uploaded successfully!");
      setIsUploading(false);
    },
    onError: (error) => {
      console.error("Error uploading story:", error);
      toast.error("Failed to upload story. Please try again.");
      setIsUploading(false);
    },
  });

  // Delete story item mutation
  const { mutate: deleteStoryMutation, isLoading: isDeleting } = useMutation({
    mutationFn: ({ storyId, itemId }) => deleteStory(storyId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast.success("Story deleted successfully!");
      setSelectedStory(null);
    },
    onError: (error) => {
      console.error("Error deleting story:", error);
      toast.error("Failed to delete story. Please try again.");
    },
  });

  const handleAddStory = async () => {
    if (isUploading) return;

    // Create a file input element
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    
    // Handle file selection
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        setIsUploading(true);

        // For now, we'll use a data URL instead of a blob URL
        const reader = new FileReader();
        reader.onload = async (event) => {
          const type = file.type.startsWith("image/") ? "image" : "video";
          const url = event.target?.result;
          
          if (!url) {
            toast.error("Failed to read file. Please try again.");
            setIsUploading(false);
            return;
          }

          // Upload story
          await uploadStory({ type, url });
        };

        reader.onerror = () => {
          toast.error("Failed to read file. Please try again.");
          setIsUploading(false);
        };

        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Error uploading story:", error);
        toast.error("Failed to upload story. Please try again.");
        setIsUploading(false);
      }
    };

    // Trigger file selection
    input.click();
  };

  // Find user's story
  const userStory = groupedStories.find(story => story.user._id === authUser?._id);

  // Sort stories: unseen first, seen last (excluding user's own story)
  const otherStories = groupedStories.filter(story => story.user._id !== authUser?._id);
  const sortedStories = [
    ...otherStories.filter(story => !seenStories.includes(story.user._id)),
    ...otherStories.filter(story => seenStories.includes(story.user._id)),
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 p-2 overflow-x-auto hide-scrollbar">
        {/* Add Story Button / User's Story */}
        <button
          onClick={userStory && userStory.items && userStory.items.length > 0 ? () => setSelectedStory(userStory) : handleAddStory}
          disabled={isUploading}
          className="flex flex-col items-center min-w-16 gap-1 relative"
        >
          <div className="avatar">
            <div className={`w-14 rounded-full ring-2 ${userStory ? 'ring-primary' : 'ring-base-content/20'} p-0.5`}>
              {userStory && userStory.items && userStory.items.length > 0 ? (
                <img
                  src={authUser?.profilePic}
                  alt="Your Story"
                  className="rounded-full w-full h-full object-cover"
                />
              ) : (
                <div className="bg-base-200 rounded-full flex items-center justify-center w-full h-full">
                  {isUploading ? (
                    <Loader2Icon className="size-6 text-base-content/70 animate-spin" />
                  ) : (
                    <PlusIcon className="size-4 text-base-content/70" />
                  )}
                </div>
              )}
            </div>
          </div>
          {userStory && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddStory();
              }}
              className="absolute -right-1 -bottom-1 bg-primary rounded-full p-1"
            >
              <PlusIcon className="size-3 text-primary-content" />
            </button>
          )}
          <span className="text-xs">
            {userStory ? "Your Story" : "Add Story"}
          </span>
        </button>

        {/* Other Users' Stories */}
        {sortedStories.map((story) => (
          <button
            key={story._id}
            className="flex flex-col items-center min-w-16 gap-1"
            onClick={() => setSelectedStory(story)}
          >
            <div className="avatar">
              <div className={`w-14 rounded-full ${seenStories.includes(story.user._id) ? 'story-ring-seen' : 'story-ring-unseen'}`}> 
                <img
                  src={story.user.profilePic}
                  alt={story.user.fullName}
                  className="rounded-full w-full h-full object-cover"
                />
              </div>
            </div>
            <span className="text-xs truncate w-full text-center">
              {story.user.fullName}
            </span>
          </button>
        ))}
      </div>

      {/* Story Viewer Modal */}
      {selectedStory && selectedStory.items && selectedStory.items.length > 0 && (
        <StoryViewer
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
          onDeleteItem={(itemId) => {
            if (window.confirm("Are you sure you want to delete this story?")) {
              deleteStoryMutation({ storyId: selectedStory._id, itemId });
            }
          }}
          isOwnStory={selectedStory.user._id === authUser?._id}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
};

export default Stories; 