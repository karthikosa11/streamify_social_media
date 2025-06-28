export const capitialize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

// Utility function to get the complete profile picture URL
export const getProfilePicUrl = (profilePic) => {
  if (!profilePic || profilePic === '') {
    // Use a simple data URL for default avatar (gray circle with user icon)
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
  }
  
  // If it's already a full URL (starts with http), return as is
  if (profilePic.startsWith('http')) {
    return profilePic;
  }
  
  // If it's a data URL, return as is
  if (profilePic.startsWith('data:')) {
    return profilePic;
  }
  
  // Fallback to default avatar for any other cases
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
};
