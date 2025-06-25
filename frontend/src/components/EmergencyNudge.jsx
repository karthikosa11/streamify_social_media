import { useState } from "react";
import { createPortal } from "react-dom";
import { SirenIcon, XIcon, SendIcon } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { getUserFriends, sendEmergencyNudge } from "../lib/api";
import PageLoader from "./PageLoader";

const EmergencyNudge = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);

  const { data: friends, isLoading: isLoadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
    enabled: isOpen, // Only fetch when the modal is open
  });

  const { mutate: nudge, isLoading: isNudging } = useMutation({
    mutationFn: sendEmergencyNudge,
    onSuccess: (data) => {
      toast.success(data.message || `Nudge sent to ${selectedFriend?.fullName}!`);
      setIsOpen(false);
      setSelectedFriend(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to send nudge.");
    },
  });

  const handleNudge = () => {
    if (selectedFriend) {
      nudge(selectedFriend._id);
    }
  };

  return (
    <>
      {/* Sidebar Button */}
      <button
        onClick={() => setIsOpen(true)}
        className='btn btn-outline justify-start w-full gap-3 px-3 normal-case transition-all duration-200 border-error hover:border-error hover:shadow-sm'
        style={{ fontWeight: 600 }}
        title="Emergency Nudge - Send urgent notification to friends"
      >
        <SirenIcon className='size-5' />
        <span>Emergency Nudge</span>
      </button>

      {/* Nudge Modal */}
      {isOpen &&
        createPortal(
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
            <div className='modal-box max-w-sm bg-base-100 shadow-xl'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='font-bold text-lg'>Send an Emergency Nudge</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className='btn btn-sm btn-circle btn-ghost'
                >
                  <XIcon className='size-5' />
                </button>
              </div>

              {isLoadingFriends ? (
                <PageLoader />
              ) : (
                <div className='space-y-2'>
                  <p className='text-sm text-base-content/70'>
                    Select a friend to send an urgent email notification to.
                  </p>
                  <div className='max-h-60 overflow-y-auto space-y-2 p-1'>
                    {friends?.map((friend) => (
                      <button
                        key={friend._id}
                        onClick={() => setSelectedFriend(friend)}
                        className={`btn w-full justify-start ${
                          selectedFriend?._id === friend._id ? "btn-primary" : "btn-ghost"
                        }`}
                      >
                        <div className='avatar'>
                          <div className='w-8 rounded-full'>
                            <img src={friend.profilePic} alt={friend.fullName} />
                          </div>
                        </div>
                        <span>{friend.fullName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className='modal-action'>
                <button
                  onClick={handleNudge}
                  className='btn btn-primary w-full'
                  disabled={!selectedFriend || isNudging}
                >
                  {isNudging ? (
                    <span className='loading loading-spinner' />
                  ) : (
                    <>
                      <SendIcon className='size-4' />
                      Send Nudge to {selectedFriend?.fullName.split(" ")[0] || "..."}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default EmergencyNudge; 