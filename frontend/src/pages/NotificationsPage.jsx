import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptFriendRequest, getFriendRequests, getRecommendedUsers, sendFriendRequest, getOutgoingFriendReqs, rejectFriendRequest } from "../lib/api";
import { BellIcon, ClockIcon, MessageSquareIcon, UserCheckIcon, UserPlusIcon, CheckCircleIcon, MapPinIcon } from "lucide-react";
import NoNotificationsFound from "../components/NoNotificationsFound";
import PageHeader from "../components/PageHeader";
import { capitialize, getProfilePicUrl } from "../lib/utils";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const [sendingStates, setSendingStates] = useState({});
  const { user: currentUser } = useAuth();

  const { data: friendRequests, isLoading: loadingRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  const { data: recommendedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getRecommendedUsers,
  });

  const { data: outgoingRequests = [], isLoading: loadingOutgoing } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  // Refresh friend requests data every 5 minutes to ensure 24-hour filtering is accurate
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [queryClient]);

  const { mutate: acceptRequestMutation, isPending: isAccepting } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast.success("Friend request accepted!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to accept friend request");
    },
  });

  const { mutate: rejectRequestMutation, isPending: isRejecting } = useMutation({
    mutationFn: rejectFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      toast.success("Friend request rejected");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to reject friend request");
    },
  });

  const { mutate: sendRequestMutation } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: (data, userId) => {
      // Update sending state for this specific user
      setSendingStates(prev => ({ ...prev, [userId]: false }));
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      // Show success message
      const user = recommendedUsers.find(u => u._id === userId);
      if (user) {
        toast.success(`Friend request sent to ${user.fullName}!`);
      }
    },
    onError: (error, userId) => {
      // Reset sending state for this specific user on error
      setSendingStates(prev => ({ ...prev, [userId]: false }));
      // Show error message
      toast.error(error.response?.data?.message || "Failed to send friend request");
    },
  });

  const handleSendFriendRequest = (userId) => {
    // Set sending state for this specific user
    setSendingStates(prev => ({ ...prev, [userId]: true }));
    sendRequestMutation(userId);
  };

  // Check if a friend request has already been sent to a user
  const hasRequestBeenSent = (userId) => {
    return outgoingRequests.some(request => request.recipient?._id === userId);
  };

  const incomingRequests = friendRequests?.incomingReqs || [];
  const acceptedRequests = friendRequests?.acceptedReqs || [];

  // Process accepted requests and determine the other user (not the current user)
  // Backend now only returns requests from the last 24 hours, so no additional filtering needed
  const recentAcceptedRequests = acceptedRequests.map((req) => {
    // Get the current user's ID from the auth context
    const currentUserId = currentUser?._id;
    
    // Determine which user is the other person (not the current user)
    const isCurrentUserSender = req.sender?._id === currentUserId;
    const otherUser = isCurrentUserSender ? req.recipient : req.sender;
    
    return {
      ...req,
      otherUser,
      isCurrentUserSender,
      // For display purposes, use the other user's info
      displayUser: otherUser
    };
  });

  return (
    <div>
      <PageHeader title="Notifications" />
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto max-w-4xl space-y-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6 lg:block hidden">Notifications</h1>

          {loadingRequests ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <>
              {incomingRequests.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <UserCheckIcon className="h-5 w-5 text-primary" />
                    Friend Requests
                    <span className="badge badge-primary ml-2">{incomingRequests.length}</span>
                  </h2>

                  <div className="space-y-3">
                    {incomingRequests.map((request) => (
                      <div
                        key={request._id}
                        className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="card-body p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="avatar w-14 h-14 rounded-full bg-base-300">
                                <img 
                                  src={getProfilePicUrl(request.sender?.profilePic)} 
                                  alt={request.sender?.fullName || 'User'} 
                                />
                              </div>
                              <div>
                                <h3 className="font-semibold">{request.sender?.fullName || 'Unknown User'}</h3>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  <span className="badge badge-secondary badge-sm">
                                    Native: {request.sender?.nativeLanguage || 'Unknown'}
                                  </span>
                                  <span className="badge badge-outline badge-sm">
                                    Learning: {request.sender?.learningLanguage || 'Unknown'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => acceptRequestMutation(request._id)}
                                disabled={isAccepting || isRejecting}
                              >
                                Accept
                              </button>
                              <button
                                className="btn btn-outline btn-error btn-sm"
                                onClick={() => rejectRequestMutation(request._id)}
                                disabled={isAccepting || isRejecting}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ACCEPTED REQS NOTIFICATONS */}
              {recentAcceptedRequests.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <BellIcon className="h-5 w-5 text-success" />
                    New Connections
                  </h2>

                  <div className="space-y-3">
                    {recentAcceptedRequests.map((notification) => (
                      <div key={notification._id} className="card bg-base-200 shadow-sm">
                        <div className="card-body p-4">
                          <div className="flex items-start gap-3">
                            <div className="avatar mt-1 size-10 rounded-full">
                              <img
                                src={getProfilePicUrl(notification.displayUser?.profilePic)}
                                alt={notification.displayUser?.fullName || 'User'}
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold">{notification.displayUser?.fullName || 'Unknown User'}</h3>
                              <p className="text-sm my-1">
                                {notification.isCurrentUserSender 
                                  ? `${notification.displayUser?.fullName || 'Unknown User'} accepted your friend request`
                                  : `You accepted ${notification.displayUser?.fullName || 'Unknown User'}'s friend request`
                                }
                              </p>
                              <p className="text-xs flex items-center opacity-70">
                                <ClockIcon className="h-3 w-3 mr-1" />
                                {new Date(notification.updatedAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="badge badge-success">
                              <MessageSquareIcon className="h-3 w-3 mr-1" />
                              New Friend
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {incomingRequests.length === 0 && recentAcceptedRequests.length === 0 && (
                <NoNotificationsFound />
              )}
            </>
          )}

          {/* Meet New Learners Section */}
          <section>
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Meet New Learners</h2>
                  <p className="opacity-70">
                    Discover perfect language exchange partners based on your profile
                  </p>
                </div>
              </div>
            </div>

            {loadingUsers || loadingOutgoing ? (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg" />
              </div>
            ) : recommendedUsers.length === 0 ? (
              <div className="card bg-base-200 p-6 text-center">
                <h3 className="font-semibold text-lg mb-2">No recommendations available</h3>
                <p className="text-base-content opacity-70">
                  Check back later for new language partners!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedUsers.map((user) => (
                  <div
                    key={user._id}
                    className="card bg-base-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="card-body p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="avatar size-16 rounded-full">
                          <img 
                            src={getProfilePicUrl(user?.profilePic)} 
                            alt={user?.fullName || 'User'} 
                          />
                        </div>

                        <div>
                          <h3 className="font-semibold text-lg">{user?.fullName || 'Unknown User'}</h3>
                          {user?.location && (
                            <div className="flex items-center text-xs opacity-70 mt-1">
                              <MapPinIcon className="size-3 mr-1" />
                              {user.location}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Languages with flags */}
                      <div className="flex flex-wrap gap-1.5">
                        <span className="badge badge-secondary">
                          Native: {capitialize(user?.nativeLanguage || 'Unknown')}
                        </span>
                        <span className="badge badge-outline">
                          Learning: {capitialize(user?.learningLanguage || 'Unknown')}
                        </span>
                      </div>

                      {user?.bio && <p className="text-sm opacity-70">{user.bio}</p>}

                      {/* Action button */}
                      <button
                        className={`btn w-full mt-2 ${
                          hasRequestBeenSent(user._id) 
                            ? 'btn-outline btn-disabled' 
                            : 'btn-primary'
                        }`}
                        onClick={() => handleSendFriendRequest(user._id)}
                        disabled={sendingStates[user._id] || isAccepting || hasRequestBeenSent(user._id)}
                      >
                        {sendingStates[user._id] ? (
                          <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Sending...
                          </>
                        ) : hasRequestBeenSent(user._id) ? (
                          <>
                            <CheckCircleIcon className="size-4 mr-2" />
                            Request Sent
                          </>
                        ) : (
                          <>
                            <UserPlusIcon className="size-4 mr-2" />
                            Send Friend Request
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
export default NotificationsPage;
