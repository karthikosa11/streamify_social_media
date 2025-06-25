import { useEffect, useState, useCallback, useRef } from "react";
import { X, Trash2 } from "lucide-react";

const StoryViewer = ({ story, onClose, onDeleteItem, isOwnStory, isDeleting }) => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const STORY_DURATION = 8000; // Increased to 8 seconds per story
  const timerRef = useRef(null);
  const indexRef = useRef(0);

  // Mark story as seen by user._id in localStorage on mount
  useEffect(() => {
    try {
      const seenStories = JSON.parse(localStorage.getItem("seenStoriesByUser") || "[]");
      if (!seenStories.includes(story.user._id)) {
        localStorage.setItem("seenStoriesByUser", JSON.stringify([...seenStories, story.user._id]));
      }
    } catch {}
  }, [story.user._id]);

  // Reset index and progress when story changes
  useEffect(() => {
    setCurrentItemIndex(0);
    setProgress(0);
    indexRef.current = 0;
  }, [story]);

  useEffect(() => {
    indexRef.current = currentItemIndex;
  }, [currentItemIndex]);

  useEffect(() => {
    if (!story?.items?.length) return;
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (STORY_DURATION / 200)); // Slower progress increment
        if (newProgress >= 100) {
          if (indexRef.current < story.items.length - 1) {
            setCurrentItemIndex(idx => idx + 1);
            return 0;
          } else {
            clearInterval(timerRef.current);
            setTimeout(() => {
              onClose();
            }, 500); // Added small delay before closing
            return prev;
          }
        }
        return newProgress;
      });
    }, 200); // Increased interval to 200ms for smoother progress
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [story, currentItemIndex, onClose]);

  // Helper to mark story as seen in localStorage
  const markStoryAsSeen = () => {
    try {
      const seenStories = JSON.parse(localStorage.getItem("seenStories") || "[]");
      if (!seenStories.includes(story._id)) {
        localStorage.setItem("seenStories", JSON.stringify([...seenStories, story._id]));
      }
    } catch {}
  };

  const handleClose = () => {
    markStoryAsSeen();
    onClose();
  };

  const handleNext = (e) => {
    e.stopPropagation();
    // console.log('Next clicked, current index:', currentItemIndex, 'total items:', story.items.length);
    if (currentItemIndex < story.items.length - 1) {
      setCurrentItemIndex(prev => prev + 1);
      setProgress(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else {
      markStoryAsSeen();
      onClose();
    }
  };

  const handlePrevious = (e) => {
    e.stopPropagation();
    // console.log('Previous clicked, current index:', currentItemIndex);
    if (currentItemIndex > 0) {
      setCurrentItemIndex(prev => prev - 1);
      setProgress(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Guard clause for invalid story data
  if (!story?.items?.length) {
    // console.log("Invalid story data:", story);
    return null;
  }

  // Debug log for items and index
  // console.log("StoryViewer items:", story.items, "currentItemIndex:", currentItemIndex, "total items:", story.items.length);

  const currentItem = story.items[currentItemIndex];

  // Guard clause for invalid current item
  if (!currentItem) {
    // console.log("Invalid current item:", currentItem, "at index:", currentItemIndex);
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      {/* Story container */}
      <div className="relative max-w-sm w-full h-[80vh] rounded-lg overflow-hidden">
        {/* Header with progress bars and user info */}
        <div className="absolute top-0 left-0 right-0 z-30">
          {/* Progress bars */}
          <div className="flex gap-1 p-2">
            {story.items.map((_, index) => (
              <div
                key={index}
                className="h-0.5 flex-1 bg-white/20 overflow-hidden rounded-full"
              >
                {index === currentItemIndex && (
                  <div
                    className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                )}
                {index < currentItemIndex && (
                  <div className="h-full bg-white w-full rounded-full" />
                )}
              </div>
            ))}
          </div>

          {/* User info */}
          <div className="flex items-center gap-2 p-3">
            <div className="avatar">
              <div className="w-8 h-8 rounded-full ring-2 ring-white/20">
                <img 
                  src={story.user.profilePic} 
                  alt={story.user.fullName}
                  className="rounded-full"
                />
              </div>
            </div>
            <span className="text-white font-medium text-sm">
              {story.user.fullName}
            </span>
          </div>
        </div>

        {/* Close button */}
        <div className="absolute top-3 right-3 flex gap-2 z-30">
          {/* Delete button for own story */}
          {isOwnStory && onDeleteItem && (
            <button
              className="bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors disabled:opacity-60"
              onClick={() => onDeleteItem(currentItem._id)}
              disabled={isDeleting}
              title="Delete this story"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isDeleting ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <Trash2 className="size-5" />
              )}
            </button>
          )}
          <button
            onClick={handleClose}
            className="text-white hover:opacity-80 transition-opacity"
          >
            <X className="size-6" />
          </button>
        </div>

        {/* Story content */}
        <div className="w-full h-full bg-black">
          {currentItem.type === "image" ? (
            <img
              src={currentItem.url}
              alt="Story"
              className="w-full h-full object-contain"
              onError={(e) => {
                console.error("Error loading image:", e);
                e.target.src = story.user.profilePic; // Fallback to user's profile pic
              }}
            />
          ) : (
            <video
              src={currentItem.url}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              muted
              onError={(e) => {
                console.error("Error loading video:", e);
                e.target.style.display = "none";
              }}
            />
          )}
        </div>

        {/* Navigation buttons */}
        <div className="absolute inset-0 flex items-center justify-between z-20">
          <button
            className="w-1/3 h-full focus:outline-none"
            onClick={handlePrevious}
          />
          <button
            className="w-1/3 h-full focus:outline-none"
            onClick={handleNext}
          />
        </div>
      </div>
    </div>
  );
};

export default StoryViewer; 