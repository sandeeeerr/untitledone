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
import { createProjectInvitation, listProjectInvitations, type ProjectInvitation, type ProjectInvitationInsert, acceptInvitation, listProjectMembers, type ProjectMember } from "./projects";

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

// Project Members & Invitations
export function useProjectInvitations(projectId: string) {
    return useQuery<ProjectInvitation[]>({
        queryKey: ["project", projectId, "invitations"],
        queryFn: () => listProjectInvitations(projectId),
        enabled: Boolean(projectId),
    });
}

export function useCreateProjectInvitation(projectId: string) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: (payload: ProjectInvitationInsert) => createProjectInvitation(projectId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project", projectId, "invitations"] });
            queryClient.invalidateQueries({ queryKey: ["project", projectId, "members"] });
            toast({ title: "Invitation sent", description: "The collaborator has been invited." });
        },
        onError: (error: unknown) => {
            const errorMessage = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : "Failed to send invitation"
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        },
    });
}

export function useAcceptInvitation(invitationId: string, token: string) {
    const { toast } = useToast();
    return useMutation({
        mutationFn: () => acceptInvitation(invitationId, token),
        retry: false,
        onError: (error: unknown) => {
            const errorMessage = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : "Failed to accept invitation"
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        },
    });
}

export function useProjectMembers(projectId: string) {
    return useQuery<ProjectMember[]>({
        queryKey: ["project", projectId, "members"],
        queryFn: () => listProjectMembers(projectId),
        enabled: Boolean(projectId),
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
