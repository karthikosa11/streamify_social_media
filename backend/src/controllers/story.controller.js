import Story from "../models/Story.js";

export async function createStory(req, res) {
  try {
    const { type, url } = req.body;
    // console.log("Creating story with data:", { type, url });
    // console.log("User:", req.user);

    if (!type || !url) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["image", "video"].includes(type)) {
      return res.status(400).json({ message: "Invalid story type" });
    }

    // Find existing story or create new one
    let story = await Story.findOne({ user: req.user._id });
    // console.log("Existing story:", story);

    if (story) {
      // Check if user has reached the maximum number of story items (e.g., 20)
      if (story.items.length >= 20) {
        return res.status(400).json({ 
          message: "Maximum number of story items reached. Delete some items to add more." 
        });
      }

      // Add new item to existing story
      story.items.push({ type, url });
      story = await story.save();
      // console.log("Updated story:", story);
    } else {
      // Create new story
      story = await Story.create({
        user: req.user._id,
        items: [{ type, url }],
      });
      // console.log("Created new story:", story);
    }

    // Populate user details before sending response
    await story.populate("user", "fullName profilePic");
    // console.log("Final story with populated user:", story);

    return res.status(201).json(story);
  } catch (error) {
    // console.log("Error in createStory controller:", error.message);
    // console.log("Full error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getStories(req, res) {
  try {
    // console.log("Getting stories for user:", req.user._id);
    // console.log("User's friends:", req.user.friends);

    // Get stories from friends and the user's own stories
    const stories = await Story.find({
      user: { $in: [...(req.user.friends || []), req.user._id] },
    })
      .populate("user", "fullName profilePic")
      .sort("-createdAt");

    // console.log("Found stories:", stories);
    res.status(200).json(stories);
  } catch (error) {
    // console.log("Error in getStories controller:", error.message);
    // console.log("Full error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteStory(req, res) {
  try {
    const { storyId } = req.params;
    const { itemId } = req.body;

    const story = await Story.findById(storyId);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (itemId) {
      // Remove specific story item
      story.items = story.items.filter(item => item._id.toString() !== itemId);
      
      if (story.items.length === 0) {
        // Delete the whole story if no items left
        await story.deleteOne();
        return res.status(200).json({ message: "Story deleted successfully" });
      }

      await story.save();
      return res.status(200).json(story);
    }

    // Delete the whole story
    await story.deleteOne();
    res.status(200).json({ message: "Story deleted successfully" });
  } catch (error) {
    // console.log("Error in deleteStory controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
} 