import { useQuery } from "@tanstack/react-query";
import { getAuthUser } from "../lib/api";

const useAuthUser = () => {
  const authUser = useQuery({
    queryKey: ["authUser"],
    queryFn: getAuthUser,
    retry: false, // auth check
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return { 
    isLoading: authUser.isLoading, 
    isError: authUser.isError,
    error: authUser.error,
    authUser: authUser.data?.user || null 
  };
};

export default useAuthUser;
