import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  HeartIcon as HeartSolid,
  MessageCircle,
  Share2,
  Trash2,
  HeartIcon as HeartOutline,
  Copy,
  ExternalLink,
  Users,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { likePost, commentOnPost, deletePost, deleteComment, sharePost } from "../lib/api";
import useAuthUser from "../hooks/useAuthUser";

const Post = ({ post }) => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef();

  // Close share menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { mutate: like, isLoading: isLiking } = useMutation({
    mutationFn: likePost,
    onSuccess: () => {
      queryClient.invalidateQueries(["posts"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to like post.");
    },
  });

  const { mutate: comment, isLoading: isCommenting } = useMutation({
    mutationFn: commentOnPost,
    onSuccess: () => {
      queryClient.invalidateQueries(["posts"]);
      setCommentText("");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to comment on post.");
    },
  });

  const { mutate: removePost, isLoading: isDeletingPost } = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      toast.success("Post deleted.");
      queryClient.invalidateQueries(["posts"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete post.");
    },
  });

  const { mutate: removeComment, isLoading: isDeletingComment } = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      toast.success("Comment deleted.");
      queryClient.invalidateQueries(["posts"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete comment.");
    },
  });

  const { mutate: share, isLoading: isSharing } = useMutation({
    mutationFn: sharePost,
    onSuccess: () => {
      toast.success("Post shared successfully!");
      queryClient.invalidateQueries(["posts"]);
      setShowShareMenu(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to share post.");
    },
  });

  const isLiked = authUser && post.likes && post.likes.includes(authUser._id);
  const isMyPost = authUser && post.user._id === authUser._id;

  const handleLike = () => {
    if (!isLiking) {
      like(post._id);
    }
  };

  const handleComment = (e) => {
    e.preventDefault();
    
    if (commentText.trim() && !isCommenting) {
      comment({ postId: post._id, text: commentText });
    }
  };

  const handleDeletePost = () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      removePost(post._id);
    }
  };

  const handleDeleteComment = (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      removeComment({ postId: post._id, commentId });
    }
  };

  const handleShare = (type) => {
    const postUrl = `${window.location.origin}/post/${post._id}`;
    const postText = `${post.caption}\n\nCheck out this post on Streamify!`;

    switch (type) {
      case 'copy':
        navigator.clipboard.writeText(postUrl).then(() => {
          toast.success("Post link copied to clipboard!");
        }).catch(() => {
          toast.error("Failed to copy link.");
        });
        break;
      
      case 'twitter':
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}&url=${encodeURIComponent(postUrl)}`;
        window.open(twitterUrl, '_blank');
        break;
      
      case 'facebook':
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
        window.open(facebookUrl, '_blank');
        break;
      
      case 'whatsapp':
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(postText + ' ' + postUrl)}`;
        window.open(whatsappUrl, '_blank');
        break;
      
      case 'internal':
        share(post._id);
        break;
      
      default:
        break;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className='bg-base-200 rounded-lg shadow-md mb-6'>
      {/* Post Header */}
      <div className='flex items-center justify-between p-4 border-b border-base-300'>
        <Link to={`/profile/${post.user.username}`} className='flex items-center gap-3'>
          <div className='avatar'>
            <div className='w-10 rounded-full'>
              <img src={post.user.profilePic} alt={post.user.fullName} />
            </div>
          </div>
          <div>
            <p className='font-semibold text-base-content'>{post.user.fullName}</p>
            <p className='text-xs text-base-content/70'>
              {formatDate(post.createdAt)}
            </p>
          </div>
        </Link>
        {isMyPost && (
          <button
            onClick={handleDeletePost}
            className='btn btn-ghost btn-sm text-error'
            disabled={isDeletingPost}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Post Content */}
      <div className='p-4'>
        <p className='text-base-content mb-4'>{post.caption}</p>
        {post.mediaUrl && (
          <div className='rounded-lg overflow-hidden'>
            {post.mediaUrl.endsWith(".mp4") ? (
              <video src={post.mediaUrl} controls className='w-full' />
            ) : (
              <img src={post.mediaUrl} alt='Post media' className='w-full' />
            )}
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className='flex justify-between items-center p-4 border-t border-base-300'>
        <div className='flex gap-4'>
          <button onClick={handleLike} className='flex items-center gap-2 text-base-content/70 hover:text-primary transition-colors'>
            {isLiked ? (
              <HeartSolid className='text-red-500' size={20} fill='red' />
            ) : (
              <HeartOutline size={20} />
            )}
            <span>{post.likes.length} Likes</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className='flex items-center gap-2 text-base-content/70 hover:text-primary transition-colors'
          >
            <MessageCircle size={20} />
            <span>{post.comments.length} Comments</span>
          </button>
        </div>
        
        {/* Share Button with Dropdown */}
        <div className='relative' ref={shareMenuRef}>
          <button 
            onClick={() => setShowShareMenu(!showShareMenu)}
            className='flex items-center gap-2 text-base-content/70 hover:text-primary transition-colors'
            title="Share this post"
          >
            <Share2 size={20} />
            <span>Share</span>
          </button>
          
          {showShareMenu && (
            <div className='absolute right-0 top-full mt-2 w-48 bg-base-100 rounded-lg shadow-lg z-10 border border-base-300'>
              <div className='p-2 space-y-1'>
                <button
                  onClick={() => handleShare('copy')}
                  className='flex items-center gap-2 w-full px-3 py-2 hover:bg-base-200 rounded transition-colors'
                >
                  <Copy size={16} />
                  <span className='text-sm'>Copy Link</span>
                </button>
                
                <button
                  onClick={() => handleShare('internal')}
                  className='flex items-center gap-2 w-full px-3 py-2 hover:bg-base-200 rounded transition-colors'
                  disabled={isSharing}
                >
                  <Users size={16} />
                  <span className='text-sm'>{isSharing ? 'Sharing...' : 'Share to Feed'}</span>
                </button>
                
                <div className='border-t border-base-300 my-1'></div>
                
                <button
                  onClick={() => handleShare('twitter')}
                  className='flex items-center gap-2 w-full px-3 py-2 hover:bg-base-200 rounded transition-colors'
                >
                  <span className='text-blue-400'>𝕏</span>
                  <span className='text-sm'>Twitter</span>
                </button>
                
                <button
                  onClick={() => handleShare('facebook')}
                  className='flex items-center gap-2 w-full px-3 py-2 hover:bg-base-200 rounded transition-colors'
                >
                  <span className='text-blue-400'>f</span>
                  <span className='text-sm'>Facebook</span>
                </button>
                
                <button
                  onClick={() => handleShare('whatsapp')}
                  className='flex items-center gap-2 w-full px-3 py-2 hover:bg-base-200 rounded transition-colors'
                >
                  <span className='text-green-500'>📱</span>
                  <span className='text-sm'>WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className='p-4 border-t border-base-300'>
          <form onSubmit={handleComment} className='flex gap-2 mb-4'>
            <input
              key={`comment-input-${post._id}`}
              type='text'
              value={commentText || ""}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder='Add a comment...'
              className='input input-bordered w-full'
            />
            <button type='submit' className='btn btn-primary' disabled={isCommenting}>
              {isCommenting ? "..." : "Post"}
            </button>
          </form>
          <div className='space-y-3'>
            {post.comments.map((comment) => (
              <div key={comment._id} className='flex items-start gap-3'>
                <div className='avatar'>
                  <div className='w-8 rounded-full'>
                    <img src={comment.user.profilePic} alt={comment.user.fullName} />
                  </div>
                </div>
                <div className='flex-1'>
                  <div className='bg-base-300 rounded-lg p-2'>
                    <div className='flex justify-between items-center'>
                      <p className='font-semibold text-sm'>{comment.user.fullName}</p>
                      {authUser && comment.user._id === authUser._id && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className='btn btn-ghost btn-xs text-error'
                          disabled={isDeletingComment}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <p className='text-sm'>{comment.text}</p>
                  </div>
                  <p className='text-xs text-base-content/70 mt-1'>
                    {formatDate(comment.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Post; 