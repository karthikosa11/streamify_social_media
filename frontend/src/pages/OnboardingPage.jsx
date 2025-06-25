import { useState, useEffect } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { completeOnboarding } from "../lib/api";
import { LoaderIcon, MapPinIcon, ShipWheelIcon, ShuffleIcon, Camera, Edit2 } from "lucide-react";
import { LANGUAGES } from "../constants";
import { axiosInstance } from "../lib/axios";
import { useNavigate } from "react-router-dom";

const OnboardingPage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const [formState, setFormState] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    nativeLanguage: authUser?.nativeLanguage || "",
    learningLanguage: authUser?.learningLanguage || "",
    location: authUser?.location || "",
    profilePic: authUser?.profilePic || "",
  });

  // Reset form when authUser changes
  useEffect(() => {
    if (authUser) {
      setFormState({
        fullName: authUser.fullName || "",
        bio: authUser.bio || "",
        nativeLanguage: authUser.nativeLanguage || "",
        learningLanguage: authUser.learningLanguage || "",
        location: authUser.location || "",
        profilePic: authUser.profilePic || "",
      });
    }
  }, [authUser]);

  const { mutate: onboardingMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.response.data.message);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // If there's a new profile picture file, upload it first
      if (formState.profilePic instanceof File) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('profilePic', formState.profilePic);
        
        const response = await axiosInstance.put('/users/profile', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        // Update the profilePic URL with the response
        setFormState(prev => ({
          ...prev,
          profilePic: response.data.profilePic
        }));
      }

      // Now submit the onboarding data
      onboardingMutation(formState);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRandomAvatar = () => {
    const idx = Math.floor(Math.random() * 100) + 1; // 1-100 included
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    setFormState({ ...formState, profilePic: randomAvatar });
    toast.success("Random profile picture generated!");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormState(prev => ({
        ...prev,
        profilePic: file
      }));
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="card bg-base-200 w-full max-w-3xl shadow-xl">
        <div className="card-body p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">
              {isEditing ? "Edit Profile" : "Your Profile"}
            </h1>
            <button
              onClick={toggleEdit}
              className="btn btn-ghost btn-circle"
              title={isEditing ? "Cancel Editing" : "Edit Profile"}
            >
              <Edit2 className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PROFILE PIC CONTAINER */}
            <div className="flex flex-col items-center justify-center space-y-4">
              {/* IMAGE PREVIEW */}
              <div className="relative">
                <div className="size-32 rounded-full bg-base-300 overflow-hidden">
                  {formState.profilePic ? (
                    <img
                      src={formState.profilePic instanceof File ? URL.createObjectURL(formState.profilePic) : formState.profilePic}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Camera className="size-12 text-base-content opacity-40" />
                    </div>
                  )}
                </div>
                {isEditing && (
                  <label
                    htmlFor="profilePic"
                    className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90"
                  >
                    <Camera className="w-5 h-5" />
                    <input
                      type="file"
                      id="profilePic"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Generate Random Avatar BTN */}
              {isEditing && (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleRandomAvatar} className="btn btn-accent">
                    <ShuffleIcon className="size-4 mr-2" />
                    Generate Random Avatar
                  </button>
                </div>
              )}
            </div>

            {/* FULL NAME */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Full Name</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formState.fullName}
                onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                className="input input-bordered w-full"
                placeholder="Your full name"
                required
                disabled={!isEditing}
              />
            </div>

            {/* BIO */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Bio</span>
              </label>
              <textarea
                name="bio"
                value={formState.bio}
                onChange={(e) => setFormState({ ...formState, bio: e.target.value })}
                className="textarea textarea-bordered w-full"
                placeholder="Tell us about yourself..."
                rows={3}
                disabled={!isEditing}
              />
            </div>

            {/* NATIVE LANGUAGE */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Native Language</span>
              </label>
              <select
                name="nativeLanguage"
                value={formState.nativeLanguage}
                onChange={(e) => setFormState({ ...formState, nativeLanguage: e.target.value })}
                className="select select-bordered w-full"
                required
                disabled={!isEditing}
              >
                <option value="">Select your native language</option>
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* LEARNING LANGUAGE */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Language You're Learning</span>
              </label>
              <select
                name="learningLanguage"
                value={formState.learningLanguage}
                onChange={(e) => setFormState({ ...formState, learningLanguage: e.target.value })}
                className="select select-bordered w-full"
                required
                disabled={!isEditing}
              >
                <option value="">Select the language you're learning</option>
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* LOCATION */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Location</span>
              </label>
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="location"
                  value={formState.location}
                  onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                  className="input input-bordered w-full pl-10"
                  placeholder="Your location"
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            {isEditing && (
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isPending || isUploading}
              >
                {isPending || isUploading ? (
                  <>
                    <LoaderIcon className="size-4 mr-2 animate-spin" />
                    {isUploading ? "Uploading..." : "Saving..."}
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
