import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listComments, countComments, createComment, updateComment, deleteComment, type ProjectComment, type ListCommentsParams, type CreateCommentInput, type UpdateCommentInput } from "./comments";
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
import { getProjects, getProject, type Project, uploadProjectFile, getProjectFiles, getProjectFileDetail, type ProjectFile, type ProjectFileDetail, type UploadFileInput, createProjectVersion, getProjectVersions, type ProjectVersion, type CreateVersionInput, getProjectActivity, type ProjectActivityVersion, createFeedbackChange, updateFeedbackChange, deleteFeedbackChange, getProjectsLastActivity, getMyStorageUsage, type StorageUsage } from "./projects";
import { listPins, pinProject, unpinProject, type ProjectPin } from "./pins";
import { createProjectInvitation, listProjectInvitations, type ProjectInvitationInsert, acceptInvitation, listProjectMembers, leaveProject } from "./projects";
import type { ProjectInvitation, ProjectMember } from "./projects";

// Utility function to safely extract error message
function getErrorMessage(error: unknown, fallback: string): string {
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        return error.message;
    }
    return fallback;
}

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

export function useProject(id: string, initialData?: Project) {
    return useQuery<Project>({
        queryKey: ["project", id],
        queryFn: () => getProject(id),
        enabled: Boolean(id),
        initialData,
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

// Pins
export function usePinnedProjects() {
    return useQuery<ProjectPin[]>({
        queryKey: ["projects", "pinned"],
        queryFn: () => listPins(),
        staleTime: 60 * 1000,
    });
}

export function usePinProject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (projectId: string) => pinProject(projectId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", "pinned"] }),
    })
}

export function useUnpinProject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (projectId: string) => unpinProject(projectId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", "pinned"] }),
    })
}

export function useProjectsLastActivity(ids: string[], options?: { enabled?: boolean; staleTime?: number }) {
    return useQuery<Record<string, string>>({
        queryKey: ["projects", "last-activity", { ids }],
        queryFn: () => getProjectsLastActivity(ids),
        enabled: (options?.enabled ?? ids.length > 0),
        staleTime: options?.staleTime ?? 60 * 1000,
    })
}

// Storage usage
export function useMyStorageUsage(options?: { enabled?: boolean; staleTime?: number }) {
    return useQuery<StorageUsage>({
        queryKey: ["storage", "usage", "me"],
        queryFn: () => getMyStorageUsage(),
        staleTime: options?.staleTime ?? 30 * 1000,
        enabled: options?.enabled ?? true,
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

export function useLeaveProject() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    
    return useMutation({
        mutationFn: (projectId: string) => leaveProject(projectId),
        onSuccess: (_, projectId) => {
            queryClient.invalidateQueries({ queryKey: ["project", projectId, "members"] });
            queryClient.invalidateQueries({ queryKey: ["projects", "list"] });
            toast({ title: "Left project", description: "You have successfully left the project." });
        },
        onError: (error: unknown) => {
            const errorMessage = getErrorMessage(error, "Failed to leave project");
            toast({ variant: "destructive", title: "Error", description: errorMessage });
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

// Project Files
export function useProjectFiles(projectId: string) {
    return useQuery<ProjectFile[]>({
        queryKey: ["project", projectId, "files"],
        queryFn: () => getProjectFiles(projectId),
        enabled: Boolean(projectId),
    });
}

export function useProjectFileDetail(projectId: string, fileId: string) {
    return useQuery<ProjectFileDetail>({
        queryKey: ["project", projectId, "files", fileId],
        queryFn: () => getProjectFileDetail(projectId, fileId),
        enabled: Boolean(projectId) && Boolean(fileId),
    });
}

export function useUploadProjectFile(projectId: string) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    
    return useMutation({
        mutationFn: (payload: UploadFileInput) => uploadProjectFile(projectId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project", projectId, "files"] });
            queryClient.invalidateQueries({ queryKey: ["project", projectId, "activity"] });
            toast({ title: "File uploaded", description: "File has been uploaded successfully." });
        },
        onError: (error: unknown) => {
            const errorMessage = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : "Failed to upload file";
            toast({ variant: "destructive", title: "Upload failed", description: errorMessage });
        },
    });
}

// Project Versions
export function useProjectVersions(projectId: string) {
    return useQuery<ProjectVersion[]>({
        queryKey: ["project", projectId, "versions"],
        queryFn: () => getProjectVersions(projectId),
        enabled: Boolean(projectId),
    });
}

export function useCreateProjectVersion(projectId: string) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    
    return useMutation({
        mutationFn: (payload: CreateVersionInput) => createProjectVersion(projectId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project", projectId, "versions"] });
            queryClient.invalidateQueries({ queryKey: ["project", projectId, "activity"] });
            toast({ title: "Version created", description: "New version has been created successfully." });
        },
        onError: (error: unknown) => {
            const errorMessage = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : "Failed to create version";
            toast({ variant: "destructive", title: "Creation failed", description: errorMessage });
        },
    });
}

// Project Activity
export function useProjectActivity(projectId: string) {
    return useQuery<ProjectActivityVersion[]>({
        queryKey: ["project", projectId, "activity"],
        queryFn: () => getProjectActivity(projectId),
        enabled: Boolean(projectId),
    });
}

export function useCreateFeedbackChange(projectId: string) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { data: currentProfile } = useProfile();
    
    return useMutation({
        mutationFn: ({ versionId, description }: { versionId: string; description?: string }) => createFeedbackChange(projectId, versionId, description),
        onMutate: async ({ versionId, description = "Nieuwe feedback" }) => {
            const key = ["project", projectId, "activity"] as const;
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData<ProjectActivityVersion[]>(key);
            
            if (previous) {
                // Find the version to add the feedback to
                const versionIndex = previous.findIndex(v => v.id === versionId);
                if (versionIndex !== -1) {
                    const tempId = `temp-${Date.now()}`;
                    const now = new Date().toISOString();
                    
                    // Get current user info for optimistic display
                    const authorName = currentProfile?.display_name || currentProfile?.username || "You";
                    const authorId = currentProfile?.id || "temp-user-id";
                    const avatar = currentProfile?.avatar_url || null;
                    
                    // Create optimistic feedback change
                    const optimisticChange = {
                        id: tempId,
                        type: "feedback" as const,
                        description,
                        author: authorName,
                        authorId: authorId,
                        time: now.substring(11, 16), // HH:mm format
                        fullTimestamp: now,
                        avatar: avatar,
                        fileId: null,
                    };
                    
                    const next = [...previous];
                    next[versionIndex] = {
                        ...next[versionIndex],
                        microChanges: [optimisticChange, ...next[versionIndex].microChanges]
                    };
                    
                    queryClient.setQueryData(key, next);
                }
            }
            return { previous } as const;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project", projectId, "activity"] });
            toast({ title: "Feedback toegevoegd", description: "Je feedback is succesvol toegevoegd." });
        },
        onError: (error: unknown, _vars, context) => {
            // Rollback optimistic update
            if (context?.previous) {
                queryClient.setQueryData(["project", projectId, "activity"], context.previous);
            }
            const errorMessage = getErrorMessage(error, "Failed to create feedback");
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["project", projectId, "activity"] });
        },
    });
}

export function useUpdateFeedbackChange(projectId: string) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: ({ changeId, description }: { changeId: string; description: string }) => updateFeedbackChange(projectId, changeId, description),
        onMutate: async ({ changeId, description }) => {
            const key = ["project", projectId, "activity"] as const;
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData<ProjectActivityVersion[]>(key);
            if (previous) {
                const next = previous.map(v => ({
                    ...v,
                    microChanges: v.microChanges.map(mc => mc.id === changeId ? { ...mc, description } : mc)
                }));
                queryClient.setQueryData(key, next);
            }
            return { previous } as const;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project", projectId, "activity"] });
            toast({ title: "Feedback updated" });
        },
        onError: (error: unknown) => {
            const errorMessage = getErrorMessage(error, "Failed to update feedback");
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["project", projectId, "activity"] });
        },
    });
}

export function useDeleteFeedbackChange(projectId: string) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: ({ changeId }: { changeId: string }) => deleteFeedbackChange(projectId, changeId),
        onMutate: async ({ changeId }) => {
            const key = ["project", projectId, "activity"] as const;
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData<ProjectActivityVersion[]>(key);
            if (previous) {
                const next = previous.map(v => ({
                    ...v,
                    microChanges: v.microChanges.filter(mc => mc.id !== changeId)
                }));
                queryClient.setQueryData(key, next);
            }
            return { previous } as const;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project", projectId, "activity"] });
            toast({ title: "Feedback deleted" });
        },
        onError: (error: unknown, _vars, context) => {
            // rollback
            if (context?.previous) {
                queryClient.setQueryData(["project", projectId, "activity"], context.previous);
            }
            const errorMessage = getErrorMessage(error, "Failed to delete feedback");
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["project", projectId, "activity"] });
        },
    });
}

// Comments
export function useProjectComments(params: ListCommentsParams, options?: { enabled?: boolean; staleTime?: number }) {
    const { projectId, activityChangeId, versionId, fileId } = params;
    const contextKey = activityChangeId ? { activityChangeId } : versionId ? { versionId } : fileId ? { fileId } : {};
    return useQuery<ProjectComment[]>({
        queryKey: ["project", projectId, "comments", { ...contextKey }],
        queryFn: () => listComments(params),
        enabled: (options?.enabled ?? (Boolean(projectId) && Boolean(activityChangeId || versionId || fileId))),
        staleTime: options?.staleTime ?? 5 * 60 * 1000,
    });
}

export function useCommentsCount(params: Omit<ListCommentsParams, "limit" | "cursor">, options?: { enabled?: boolean; staleTime?: number }) {
    const { projectId, activityChangeId, versionId, fileId } = params;
    const contextKey = activityChangeId ? { activityChangeId } : versionId ? { versionId } : fileId ? { fileId } : {};
    return useQuery<number>({
        queryKey: ["project", projectId, "comments", "count", { ...contextKey }],
        queryFn: () => countComments(params),
        enabled: (options?.enabled ?? (Boolean(projectId) && Boolean(activityChangeId || versionId || fileId))),
        staleTime: options?.staleTime ?? 60 * 1000,
    });
}

export function useCreateProjectComment() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: (input: CreateCommentInput) => createComment(input),
        onMutate: async (input) => {
            const { projectId, activityChangeId, versionId, fileId } = input;
            const contextKey: Record<string, string> = activityChangeId ? { activityChangeId } : versionId ? { versionId } : fileId ? { fileId } : {};
            const queryKey = ["project", projectId, "comments", { ...contextKey }];
            await queryClient.cancelQueries({ queryKey: ["project", projectId, "comments"] });
            const previous = queryClient.getQueryData<ProjectComment[]>(queryKey) || [];
            const optimistic: ProjectComment = {
                id: `optimistic-${Date.now()}` as unknown as ProjectComment["id"],
                project_id: projectId,
                parent_id: input.parentId ?? null,
                activity_change_id: activityChangeId ?? null,
                version_id: versionId ?? null,
                file_id: fileId ?? null,
                user_id: "me" as unknown as ProjectComment["user_id"],
                comment: input.comment,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                edited: false,
                resolved: false,
                timestamp_ms: input.timestampMs ?? null,
                profiles: null,
            } as ProjectComment;
            queryClient.setQueryData<ProjectComment[]>(queryKey, [optimistic, ...previous]);
            return { previous, queryKey } as const;
        },
        onError: (error: unknown, _input, context) => {
            if (context) {
                queryClient.setQueryData(context.queryKey, context.previous);
            }
            const errorMessage = getErrorMessage(error, "Failed to post comment");
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        },
        onSuccess: (created) => {
            // Replace optimistic with fresh fetch
            queryClient.invalidateQueries({ queryKey: ["project", created.project_id, "comments"] });
            queryClient.invalidateQueries({ queryKey: ["project", created.project_id, "activity"] });
            toast({ title: "Comment posted", description: "Your comment has been posted." });
        },
    });
}

export function useUpdateProjectComment() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: (input: UpdateCommentInput) => updateComment(input),
        onMutate: async (input) => {
            const { projectId } = input;
            // Optimistically update across all comment contexts for this project
            const keys = queryClient.getQueriesData<ProjectComment[]>({ queryKey: ["project", projectId, "comments"] });
            const previous = keys.map(([key, data]) => ({ key, data }));
            previous.forEach(({ key, data }) => {
                if (!data) return;
                const updated = data.map((c) => (c.id === input.commentId ? { ...c, comment: input.comment ?? c.comment, resolved: typeof input.resolved === 'boolean' ? input.resolved : c.resolved, edited: true } : c));
                queryClient.setQueryData(key, updated);
            });
            return { previous } as const;
        },
        onError: (error: unknown, input, context) => {
            context?.previous.forEach(({ key, data }) => queryClient.setQueryData(key, data));
            const errorMessage = getErrorMessage(error, "Failed to update comment");
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        },
        onSuccess: (updated) => {
            queryClient.invalidateQueries({ queryKey: ["project", updated.project_id, "comments"] });
            toast({ title: "Updated", description: "Comment updated." });
        },
    });
}

export function useDeleteProjectComment(projectId: string) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: (commentId: string) => deleteComment(projectId, commentId),
        onMutate: async (commentId: string) => {
            const keys = queryClient.getQueriesData<ProjectComment[]>({ queryKey: ["project", projectId, "comments"] });
            const previous = keys.map(([key, data]) => ({ key, data }));
            previous.forEach(({ key, data }) => {
                if (!data) return;
                const filtered = data.filter((c) => c.id !== commentId && c.parent_id !== commentId);
                queryClient.setQueryData(key, filtered);
            });
            return { previous } as const;
        },
        onError: (error: unknown, _id, context) => {
            context?.previous.forEach(({ key, data }) => queryClient.setQueryData(key, data));
            const errorMessage = getErrorMessage(error, "Failed to delete comment");
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project", projectId, "comments"] });
            // Also refresh comment counts across contexts
            queryClient.invalidateQueries({ queryKey: ["project", projectId, "comments", "count"] });
            // Refresh activity to sync badges/threads if needed
            queryClient.invalidateQueries({ queryKey: ["project", projectId, "activity"] });
            toast({ title: "Deleted", description: "Comment deleted." });
        },
    });
}
