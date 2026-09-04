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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          court_id: string
          created_at: string
          ends_at: string
          id: string
          player_id: string
          price_cents: number
          starts_at: string
          status: string
        }
        Insert: {
          court_id: string
          created_at?: string
          ends_at: string
          id?: string
          player_id: string
          price_cents?: number
          starts_at: string
          status?: string
        }
        Update: {
          court_id?: string
          created_at?: string
          ends_at?: string
          id?: string
          player_id?: string
          price_cents?: number
          starts_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          address: string
          city: string
          created_at: string
          description: string
          id: string
          latitude: number | null
          location_label: string
          longitude: number | null
          name: string
          photo_url: string | null
          price_cents: number
        }
        Insert: {
          address?: string
          city?: string
          created_at?: string
          description?: string
          id?: string
          latitude?: number | null
          location_label?: string
          longitude?: number | null
          name: string
          photo_url?: string | null
          price_cents?: number
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          description?: string
          id?: string
          latitude?: number | null
          location_label?: string
          longitude?: number | null
          name?: string
          photo_url?: string | null
          price_cents?: number
        }
        Relationships: []
      }
      courts: {
        Row: {
          club_id: string
          court_type: string
          created_at: string
          description: string
          id: string
          name: string
          open_from: number
          open_to: number
          position: number
          price_per_hour_cents: number
          surface: string
        }
        Insert: {
          club_id: string
          court_type?: string
          created_at?: string
          description?: string
          id?: string
          name: string
          open_from?: number
          open_to?: number
          position?: number
          price_per_hour_cents?: number
          surface?: string
        }
        Update: {
          club_id?: string
          court_type?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          open_from?: number
          open_to?: number
          position?: number
          price_per_hour_cents?: number
          surface?: string
        }
        Relationships: [
          {
            foreignKeyName: "courts_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      match_players: {
        Row: {
          created_at: string
          id: string
          match_id: string
          player_id: string
          side: number | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          player_id: string
          side?: number | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          player_id?: string
          side?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_players_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_results: {
        Row: {
          id: string
          match_id: string
          recorded_at: string
          recorded_by: string
          score_text: string
          winner_side: number
        }
        Insert: {
          id?: string
          match_id: string
          recorded_at?: string
          recorded_by: string
          score_text: string
          winner_side: number
        }
        Update: {
          id?: string
          match_id?: string
          recorded_at?: string
          recorded_by?: string
          score_text?: string
          winner_side?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_results_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          booking_id: string | null
          club_id: string
          court_id: string | null
          created_at: string
          creator_id: string
          ends_at: string
          id: string
          is_public: boolean
          level_required: Database["public"]["Enums"]["level_tier"]
          max_players: number
          notes: string
          starts_at: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          club_id: string
          court_id?: string | null
          created_at?: string
          creator_id: string
          ends_at: string
          id?: string
          is_public?: boolean
          level_required?: Database["public"]["Enums"]["level_tier"]
          max_players?: number
          notes?: string
          starts_at: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          club_id?: string
          court_id?: string | null
          created_at?: string
          creator_id?: string
          ends_at?: string
          id?: string
          is_public?: boolean
          level_required?: Database["public"]["Enums"]["level_tier"]
          max_players?: number
          notes?: string
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string
          created_at: string
          display_name: string
          id: string
          initials: string
          level: number
          level_points: number
          level_tier: Database["public"]["Enums"]["level_tier"]
          style: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string
          created_at?: string
          display_name?: string
          id: string
          initials?: string
          level?: number
          level_points?: number
          level_tier?: Database["public"]["Enums"]["level_tier"]
          style?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string
          created_at?: string
          display_name?: string
          id?: string
          initials?: string
          level?: number
          level_points?: number
          level_tier?: Database["public"]["Enums"]["level_tier"]
          style?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      level_tier:
        | "beginner"
        | "improver"
        | "intermediate"
        | "advanced"
        | "competitor"
        | "elite"
        | "expert"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      level_tier: [
        "beginner",
        "improver",
        "intermediate",
        "advanced",
        "competitor",
        "elite",
        "expert",
      ],
    },
  },
} as const
