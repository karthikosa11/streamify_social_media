import express from 'express';
import { protectRoute } from "../middleware/auth.middleware.js";
import Post from '../../models/Post.js';

const router = express.Router();

// Get all posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'fullName profilePic')
      .populate('comments.user', 'fullName profilePic')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new post
router.post('/', protectRoute, async (req, res) => {
  try {
    const { mediaUrl, caption } = req.body;
    
    if (!mediaUrl) {
      return res.status(400).json({ message: "Media URL is required" });
    }

    const post = new Post({
      user: req.user._id,
      mediaUrl,
      caption: caption || "",
    });
    await post.save();
    await post.populate('user', 'fullName profilePic');
    res.status(201).json(post);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(400).json({ message: error.message });
  }
});

// Like/Unlike a post
router.post('/:id/like', protectRoute, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.user._id);
    if (likeIndex === -1) {
      post.likes.push(req.user._id);
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();
    await post.populate('user', 'fullName profilePic');
    res.json(post);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add a comment to a post
router.post('/:id/comment', protectRoute, async (req, res) => {
  try {
    const { text } = req.body;
    
    // Validate that text is provided and not empty
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      user: req.user._id,
      text: text.trim(),
    };

    post.comments.push(comment);
    await post.save();
    await post.populate('user', 'fullName profilePic');
    await post.populate('comments.user', 'fullName profilePic');

    res.status(201).json(post);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(400).json({ message: error.message });
  }
});

// Delete a post
router.delete('/:id', protectRoute, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a comment
router.delete('/:postId/comments/:commentId', protectRoute, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Find the comment
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if the user is the owner of the comment
    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Remove the comment
    post.comments = post.comments.filter(comment => comment._id.toString() !== commentId);
    await post.save();

    // Return the updated post with populated user details
    const updatedPost = await Post.findById(postId)
      .populate('user', 'fullName profilePic')
      .populate('comments.user', 'fullName profilePic');

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(400).json({ message: error.message });
  }
});

export default router; 