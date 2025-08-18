import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createTodo,
    deleteTodo,
    getTodos,
    TodoInsert,
    TodoUpdate,
    updateTodo,
} from "./todos";
import { useToast } from "@/hooks/use-toast";
import { getCurrentProfile, updateCurrentProfile, type Profile, type ProfileUpdate, deleteCurrentProfile } from "./profiles";
import { getProjects, type Project } from "./projects";

export function useTodos({ done }: { done?: boolean } = {}) {
    return useQuery({
        queryKey: ["todos", { done }],
        queryFn: () => getTodos({ done }),
    });
}

export function useCreateTodo() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (todo: TodoInsert) => createTodo(todo),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["todos"] });
            toast({
                title: "Success",
                description: "Todo created successfully",
            });
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        },
    });
}

export function useUpdateTodo() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ id, todo }: { id: number; todo: TodoUpdate }) =>
            updateTodo(id, todo),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["todos"] });
            toast({
                title: "Success",
                description: "Todo updated successfully",
            });
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        },
    });
}

export function useDeleteTodo() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (id: number) => deleteTodo(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["todos"] });
            toast({
                title: "Success",
                description: "Todo deleted successfully",
            });
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        },
    });
}

// Profiles
export function useProfile() {
    return useQuery<Profile | null>({
        queryKey: ["profile", "me"],
        queryFn: () => getCurrentProfile(),
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (update: ProfileUpdate) => updateCurrentProfile(update),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
            toast({ title: "Saved", description: "Profile updated" });
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        },
    });
}

// Projects
export function useProjects() {
    return useQuery<Project[]>({
        queryKey: ["projects", "list"],
        queryFn: () => getProjects(),
    });
}

export function useRecentProjects(limit: number = 4) {
    return useQuery<Project[]>({
        queryKey: ["projects", "recent", { limit }],
        queryFn: async () => {
            const projects = await getProjects();
            return [...projects]
                .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                .slice(0, limit);
        },
    });
}

export function useDeleteProfile() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: () => deleteCurrentProfile(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
            toast({ title: "Deleted", description: "Your profile was deleted" });
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        },
    });
}
