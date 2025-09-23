export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activity_changes: {
        Row: {
          author_id: string
          created_at: string
          description: string
          file_id: string | null
          id: string
          type: string
          version_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          description: string
          file_id?: string | null
          id?: string
          type: string
          version_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          description?: string
          file_id?: string | null
          id?: string
          type?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_changes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_changes_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "project_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_changes_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "project_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_socials: {
        Row: {
          created_at: string
          id: number
          platform: Database["public"]["Enums"]["social_platform"]
          profile_id: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: number
          platform: Database["public"]["Enums"]["social_platform"]
          profile_id: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: number
          platform?: Database["public"]["Enums"]["social_platform"]
          profile_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_socials_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          location: string | null
          social_links: Json | null
          updated_at: string
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          location?: string | null
          social_links?: Json | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          location?: string | null
          social_links?: Json | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      project_comments: {
        Row: {
          activity_change_id: string | null
          comment: string
          created_at: string
          edited: boolean
          file_id: string | null
          id: string
          parent_id: string | null
          project_id: string
          resolved: boolean
          timestamp_ms: number | null
          updated_at: string
          user_id: string
          version_id: string | null
        }
        Insert: {
          activity_change_id?: string | null
          comment: string
          created_at?: string
          edited?: boolean
          file_id?: string | null
          id?: string
          parent_id?: string | null
          project_id: string
          resolved?: boolean
          timestamp_ms?: number | null
          updated_at?: string
          user_id: string
          version_id?: string | null
        }
        Update: {
          activity_change_id?: string | null
          comment?: string
          created_at?: string
          edited?: boolean
          file_id?: string | null
          id?: string
          parent_id?: string | null
          project_id?: string
          resolved?: boolean
          timestamp_ms?: number | null
          updated_at?: string
          user_id?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_activity_change_id_fkey"
            columns: ["activity_change_id"]
            isOneToOne: false
            referencedRelation: "activity_changes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "project_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "project_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_project_visibility"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "project_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          collaboration_mode: string | null
          file_path: string
          file_size: number
          file_type: string
          filename: string
          id: string
          last_activity: string
          metadata: Json | null
          project_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          collaboration_mode?: string | null
          file_path: string
          file_size: number
          file_type: string
          filename: string
          id?: string
          last_activity?: string
          metadata?: Json | null
          project_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          collaboration_mode?: string | null
          file_path?: string
          file_size?: number
          file_type?: string
          filename?: string
          id?: string
          last_activity?: string
          metadata?: Json | null
          project_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_project_visibility"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          project_id: string
          role: string
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          project_id: string
          role: string
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          project_id?: string
          role?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_project_visibility"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_likes: {
        Row: {
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_likes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_project_visibility"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_likes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          added_by: string | null
          created_at: string
          id: string
          joined_at: string
          project_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          id?: string
          joined_at?: string
          project_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          id?: string
          joined_at?: string
          project_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_project_visibility"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_pins: {
        Row: {
          created_at: string
          id: number
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_pins_project_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_project_visibility"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_pins_project_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_versions: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          is_active: boolean | null
          project_id: string
          version_name: string
          version_type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          id?: string
          is_active?: boolean | null
          project_id: string
          version_name: string
          version_type: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          is_active?: boolean | null
          project_id?: string
          version_name?: string
          version_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_project_visibility"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived_at: string | null
          created_at: string
          daw_info: Json | null
          description: string | null
          downloads_enabled: boolean
          genre: string | null
          id: string
          is_private: boolean
          likes_count: number | null
          metadata: Json | null
          name: string
          owner_id: string
          plugins_used: Json | null
          status: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          daw_info?: Json | null
          description?: string | null
          downloads_enabled?: boolean
          genre?: string | null
          id?: string
          is_private?: boolean
          likes_count?: number | null
          metadata?: Json | null
          name: string
          owner_id: string
          plugins_used?: Json | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          daw_info?: Json | null
          description?: string | null
          downloads_enabled?: boolean
          genre?: string | null
          id?: string
          is_private?: boolean
          likes_count?: number | null
          metadata?: Json | null
          name?: string
          owner_id?: string
          plugins_used?: Json | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      todos: {
        Row: {
          created_at: string
          done: boolean | null
          id: number
          label: string | null
        }
        Insert: {
          created_at?: string
          done?: boolean | null
          id?: number
          label?: string | null
        }
        Update: {
          created_at?: string
          done?: boolean | null
          id?: number
          label?: string | null
        }
        Relationships: []
      }
      version_files: {
        Row: {
          added_at: string
          copied_from_version_id: string | null
          file_id: string
          id: string
          version_id: string
        }
        Insert: {
          added_at?: string
          copied_from_version_id?: string | null
          file_id: string
          id?: string
          version_id: string
        }
        Update: {
          added_at?: string
          copied_from_version_id?: string | null
          file_id?: string
          id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "version_files_copied_from_version_id_fkey"
            columns: ["copied_from_version_id"]
            isOneToOne: false
            referencedRelation: "project_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "version_files_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: true
            referencedRelation: "project_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "version_files_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "project_versions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      _project_visibility: {
        Row: {
          is_public: boolean | null
          project_id: string | null
        }
        Insert: {
          is_public?: never
          project_id?: string | null
        }
        Update: {
          is_public?: never
          project_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_invitation: {
        Args: { invitation_id: string; raw_token: string }
        Returns: Json
      }
      citext: {
        Args: { "": boolean } | { "": string } | { "": unknown }
        Returns: string
      }
      citext_hash: {
        Args: { "": string }
        Returns: number
      }
      citextin: {
        Args: { "": unknown }
        Returns: string
      }
      citextout: {
        Args: { "": string }
        Returns: unknown
      }
      citextrecv: {
        Args: { "": unknown }
        Returns: string
      }
      citextsend: {
        Args: { "": string }
        Returns: string
      }
      generate_unique_username: {
        Args: { display_name: string }
        Returns: string
      }
      generate_version_name: {
        Args: { p_project_id: string; p_version_type: string }
        Returns: string
      }
      is_project_member: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      is_project_owner: {
        Args: { p_project_id: string }
        Returns: boolean
      }
    }
    Enums: {
      social_platform:
        | "soundcloud"
        | "spotify"
        | "youtube"
        | "instagram"
        | "tiktok"
        | "x"
        | "facebook"
        | "twitch"
        | "bandcamp"
        | "mixcloud"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      social_platform: [
        "soundcloud",
        "spotify",
        "youtube",
        "instagram",
        "tiktok",
        "x",
        "facebook",
        "twitch",
        "bandcamp",
        "mixcloud",
      ],
    },
  },
} as const
