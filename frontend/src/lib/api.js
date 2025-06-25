import { axiosInstance } from "./axios";
import toast from "react-hot-toast";

export const signup = async (signupData) => {
  try {
    const response = await axiosInstance.post("/auth/signup", signupData);
    toast.success("Signup successful");
    return response.data;
  } catch (error) {
    console.error("Signup error:", error);
    throw error; // Let the component handle the error
  }
};

export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);
  return response.data;
};

export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  toast.success("Logout successfull");
  return response.data;
};

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  } catch (error) {
    // console.log("Error in logout api", error);
    return null;
  }
};

export const completeOnboarding = async (userData) => {
  const res = await axiosInstance.post("/auth/onboarding", userData);
  return res.data;
};

export const getUserFriends = async () => {
  const res = await axiosInstance.get("/users/friends");
  return res.data;
};

export const getRecommendedUsers = async () => {
  const res = await axiosInstance.get("/users/recommended");
  return res.data;
};

export const getOutgoingFriendReqs = async () => {
  const res = await axiosInstance.get("/users/outgoing-friend-requests");
  return res.data;
};

export const sendFriendRequest=async(userId)=>{
      console.log("Sending friend request to userId:", userId);
      const res = await axiosInstance.post(`/users/friend-request/${userId}`);
      console.log("Friend request response:", res.data);
      return res.data;
}

export const getFriendRequests=async()=>{
  const res=await axiosInstance.get("/users/friend-requests");
  return res.data;
}

export const acceptFriendRequest=async(requestId)=>{
  const response=await axiosInstance.put(`/users/friend-request/${requestId}/accept`);
  return response.data;
}

export const getStreamToken=async()=>{
  const res=await axiosInstance.get("/chat/token");
  return res.data;
};

//stories

// export const fetchStories=async(userId)=>{
//   const {data}=await axiosInstance.get(`stories?userId=${userId}`);
//   return data;
// };


export const uploadStoryAPI = async (mediaUrl) => {
  const { data } = await axiosInstance.post("/stories/upload", { mediaUrl });
  return data;
};

export const fetchStories = async () => {
  const { data } = await axiosInstance.get("/stories");
  // console.log("Fetched stories:", data);
  return data;
};

export const viewStoryAPI = async (storyId) => {
  const { data } = await axiosInstance.post(`/stories/${storyId}/view`);
  return data;
};

export const deleteStory = async (storyId) => {
  const response = await axiosInstance.delete(`/stories/${storyId}`);
  return response.data;
};

export const fetchPosts = async () => {
  const { data } = await axiosInstance.get("/posts");
  return data;
};

export const likePost = async (postId) => {
  const response = await axiosInstance.post(`/posts/${postId}/like`);
  return response.data;
};

export const commentOnPost = async ({ postId, text }) => {
  // Try using URLSearchParams instead of JSON
  const formData = new URLSearchParams();
  formData.append('text', text);
  
  const response = await axiosInstance.post(`/posts/${postId}/comment`, formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  return response.data;
};

export const sharePost = async (postId) => {
  const response = await axiosInstance.post(`/posts/${postId}/share`);
  return response.data;
};

export const deletePost = async (postId) => {
  const response = await axiosInstance.delete(`/posts/${postId}`);
  return response.data;
};

export const deleteComment = async ({ postId, commentId }) => {
  const response = await axiosInstance.delete(`/posts/${postId}/comments/${commentId}`);
  return response.data;
};

export const uploadPost = async ({ mediaUrl, caption }) => {
  const { data } = await axiosInstance.post("/posts", { mediaUrl, caption });
  return data;
};

export const createStory = async (storyData) => {
  const { data } = await axiosInstance.post("/stories", storyData);
  return data;
};

export const getStories = async () => {
  const { data } = await axiosInstance.get("/stories");
  return data;
};

export const deleteStoryFetch = async (storyId) => {
  const { data } = await axiosInstance.delete(`/stories/${storyId}`);
  return data;
};

export const sendEmergencyNudge = async (recipientId) => {
  const res = await axiosInstance.post(`/users/${recipientId}/nudge`);
  return res.data;
};

// AI Assistant functions
export const startAIAgent = async (channelId, userId) => {
  // console.log('🟡 API: Starting AI agent with:', { channelId, userId });
  try {
    const res = await axiosInstance.post("/ai-assistant/start", { channelId, userId });
    // console.log('✅ API: AI agent start response:', res.data);
    return res.data;
  } catch (error) {
    console.error('❌ API: AI agent start error:', error);
    console.error('❌ API: Error response:', error.response?.data);
    throw error;
  }
};

export const stopAIAgent = async (channelId) => {
  const res = await axiosInstance.post("/ai-assistant/stop", { channelId });
  return res.data;
};

export const getAIAgentStatus = async (channelId) => {
  const res = await axiosInstance.get(`/ai-assistant/status/${channelId}`);
  return res.data;
};


