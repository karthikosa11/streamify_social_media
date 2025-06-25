import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPosts } from "../lib/api";
import Post from "../components/Post";
import Stories from "../components/Stories";

const HomePage = () => {
  const queryClient = useQueryClient();
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  const handleDeletePost = (postId) => {
    // Update the posts list in the cache by filtering out the deleted post
    queryClient.setQueryData(["posts"], (oldData) => {
      return oldData.filter((post) => post._id !== postId);
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Stories Section */}
      {/* <Stories /> */}

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          posts.map((post) => (
            <Post key={post._id} post={post} onDelete={handleDeletePost} />
          ))
        )}
      </div>
    </div>
  );
};

export default HomePage;
