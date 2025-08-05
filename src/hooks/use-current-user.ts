import { useQuery } from "@tanstack/react-query";

export function useCurrentUser() {
    const queryFn = async () => {
        try {
            // Use the server-side API to get current user
            const response = await fetch("/api/auth/user", {
                method: "GET",
                credentials: "include",
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            return data.user;
        } catch (error) {
            console.error("Error fetching current user:", error);
            return null;
        }
    };

    return useQuery({
        queryKey: ["currentUser"],
        queryFn,
    });
}
