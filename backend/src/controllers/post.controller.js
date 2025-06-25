import Post from "../models/Post.js";

export const uploadPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const userId = req.user._id;
    const mediaUrl = req.file?.path; // Get the uploaded file URL from multer

    if (!mediaUrl && !caption) {
      return res.status(400).json({ message: "Post must have media or caption" });
    }

    const post = await Post.create({
      user: userId,
      mediaUrl: mediaUrl || "",
      caption: caption || "",
    });

    // Populate user details before sending response
    await post.populate("user", "fullName profilePic");

    res.status(201).json(post);
  } catch (error) {
    console.error("Error uploading post:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate("user", "fullName profilePic")
      .populate("comments.user", "fullName profilePic")
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user already liked the post
    const alreadyLiked = post.likes.includes(userId);
    if (alreadyLiked) {
      // Unlike the post
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      // Like the post
      post.likes.push(userId);
    }

    await post.save();
    res.status(200).json(post);
  } catch (error) {
    console.error("Error liking post:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const commentOnPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({
      user: userId,
      text,
      createdAt: new Date()
    });

    await post.save();
    
    // Populate user details in the response
    const updatedPost = await Post.findById(postId)
      .populate("user", "fullName profilePic")
      .populate("comments.user", "fullName profilePic");
    
    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Error commenting on post:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sharePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Create a new post as a share
    const sharedPost = await Post.create({
      user: userId,
      mediaUrl: post.mediaUrl,
      caption: `Shared from ${post.user.fullName}: ${post.caption}`,
      originalPost: postId
    });

    res.status(201).json(sharedPost);
  } catch (error) {
    console.error("Error sharing post:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the user is the owner of the post
    if (post.user.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Find the comment
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if the user is the owner of the comment or the post
    if (comment.user.toString() !== userId && post.user.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    // Remove the comment
    post.comments = post.comments.filter(comment => comment._id.toString() !== commentId);
    await post.save();

    // Return the updated post with populated user details
    const updatedPost = await Post.findById(postId)
      .populate("user", "fullName profilePic")
      .populate("comments.user", "fullName profilePic");

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Error deleting comment:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}; 