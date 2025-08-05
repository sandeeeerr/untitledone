import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const result = await authApi.signOut();
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      // Invalidate all queries to clear user data
      queryClient.invalidateQueries();
      // Redirect to login page
      router.push("/auth/login");
    },
    onError: (error) => {
      console.error("Logout error:", error);
    },
  });
} 