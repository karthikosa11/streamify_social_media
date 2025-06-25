import { useMutation } from "@tanstack/react-query";
import axios from "axios";

const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_PRESET);

  const { data } = await axios.post(
    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD}/upload`,
    formData
  );

  return data.secure_url;
};

const useUploadMedia = () =>
  useMutation({
    mutationFn: uploadToCloudinary,
  });

export default useUploadMedia;
