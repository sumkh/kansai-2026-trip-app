export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          address: string | null
          arrive_detail: string | null
          arrive_distance_m: number | null
          arrive_duration_min: number | null
          arrive_from_lat: number | null
          arrive_from_lng: number | null
          arrive_from_name: string | null
          arrive_mode: string | null
          booking_ref: string | null
          cost_jpy: number | null
          day_id: string
          description: string | null
          duration_min: number | null
          google_place_id: string | null
          id: string
          is_booked: boolean
          lat: number | null
          lng: number | null
          order: number
          photo_credit: string | null
          photo_file: string | null
          photo_is_generic: boolean
          place_name: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["activity_status"]
          title: string
          type: Database["public"]["Enums"]["activity_type"]
        }
        Insert: {
          address?: string | null
          arrive_detail?: string | null
          arrive_distance_m?: number | null
          arrive_duration_min?: number | null
          arrive_from_lat?: number | null
          arrive_from_lng?: number | null
          arrive_from_name?: string | null
          arrive_mode?: string | null
          booking_ref?: string | null
          cost_jpy?: number | null
          day_id: string
          description?: string | null
          duration_min?: number | null
          google_place_id?: string | null
          id?: string
          is_booked?: boolean
          lat?: number | null
          lng?: number | null
          order: number
          photo_credit?: string | null
          photo_file?: string | null
          photo_is_generic?: boolean
          place_name?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["activity_status"]
          title: string
          type: Database["public"]["Enums"]["activity_type"]
        }
        Update: {
          address?: string | null
          arrive_detail?: string | null
          arrive_distance_m?: number | null
          arrive_duration_min?: number | null
          arrive_from_lat?: number | null
          arrive_from_lng?: number | null
          arrive_from_name?: string | null
          arrive_mode?: string | null
          booking_ref?: string | null
          cost_jpy?: number | null
          day_id?: string
          description?: string | null
          duration_min?: number | null
          google_place_id?: string | null
          id?: string
          is_booked?: boolean
          lat?: number | null
          lng?: number | null
          order?: number
          photo_credit?: string | null
          photo_file?: string | null
          photo_is_generic?: boolean
          place_name?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["activity_status"]
          title?: string
          type?: Database["public"]["Enums"]["activity_type"]
        }
        Relationships: [
          {
            foreignKeyName: "activities_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "days"
            referencedColumns: ["id"]
          },
        ]
      }
      allowed_users: {
        Row: {
          display_name: string | null
          email: string
          is_admin: boolean
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          display_name?: string | null
          email: string
          is_admin?: boolean
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          display_name?: string | null
          email?: string
          is_admin?: boolean
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          body_markdown: string
          day_id: string
          generated_at: string
          id: string
          is_published: boolean
          title: string
        }
        Insert: {
          body_markdown: string
          day_id: string
          generated_at?: string
          id?: string
          is_published?: boolean
          title: string
        }
        Update: {
          body_markdown?: string
          day_id?: string
          generated_at?: string
          id?: string
          is_published?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: true
            referencedRelation: "days"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          category: string
          detail: string | null
          done_at: string | null
          done_by: string | null
          due_date: string | null
          id: string
          is_blocking: boolean
          title: string
          trip_id: string
        }
        Insert: {
          category: string
          detail?: string | null
          done_at?: string | null
          done_by?: string | null
          due_date?: string | null
          id?: string
          is_blocking?: boolean
          title: string
          trip_id: string
        }
        Update: {
          category?: string
          detail?: string | null
          done_at?: string | null
          done_by?: string | null
          due_date?: string | null
          id?: string
          is_blocking?: boolean
          title?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_done_by_fkey"
            columns: ["done_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      days: {
        Row: {
          base_city: string
          date: string
          day_number: number
          id: string
          summary: string | null
          title: string
          trip_id: string
        }
        Insert: {
          base_city: string
          date: string
          day_number: number
          id?: string
          summary?: string | null
          title: string
          trip_id: string
        }
        Update: {
          base_city?: string
          date?: string
          day_number?: number
          id?: string
          summary?: string | null
          title?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "days_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          activity_id: string | null
          body: string
          created_at: string
          day_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          body: string
          created_at?: string
          day_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          activity_id?: string | null
          body?: string
          created_at?: string
          day_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          activity_id: string | null
          caption: string | null
          created_at: string
          day_id: string
          id: string
          pending_local_id: string | null
          storage_path: string
          taken_at: string | null
          thumb_path: string | null
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          caption?: string | null
          created_at?: string
          day_id: string
          id?: string
          pending_local_id?: string | null
          storage_path: string
          taken_at?: string | null
          thumb_path?: string | null
          user_id: string
        }
        Update: {
          activity_id?: string | null
          caption?: string | null
          created_at?: string
          day_id?: string
          id?: string
          pending_local_id?: string | null
          storage_path?: string
          taken_at?: string | null
          thumb_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          is_admin: boolean
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          is_admin?: boolean
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          is_admin?: boolean
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          city: string
          cuisine: string | null
          hours: string | null
          id: string
          is_avoid: boolean
          is_highlight: boolean
          kind: Database["public"]["Enums"]["food_kind"]
          name: string
          name_ja: string | null
          needs_booking: boolean
          note: string | null
          photo_credit: string | null
          photo_file: string | null
          photo_is_generic: boolean
          photo_license: string | null
          photo_source: string | null
          search_key: string | null
          sort: number
          trip_id: string
          url: string | null
        }
        Insert: {
          city: string
          cuisine?: string | null
          hours?: string | null
          id?: string
          is_avoid?: boolean
          is_highlight?: boolean
          kind?: Database["public"]["Enums"]["food_kind"]
          name: string
          name_ja?: string | null
          needs_booking?: boolean
          note?: string | null
          photo_credit?: string | null
          photo_file?: string | null
          photo_is_generic?: boolean
          photo_license?: string | null
          photo_source?: string | null
          search_key?: string | null
          sort?: number
          trip_id: string
          url?: string | null
        }
        Update: {
          city?: string
          cuisine?: string | null
          hours?: string | null
          id?: string
          is_avoid?: boolean
          is_highlight?: boolean
          kind?: Database["public"]["Enums"]["food_kind"]
          name?: string
          name_ja?: string | null
          needs_booking?: boolean
          note?: string | null
          photo_credit?: string | null
          photo_file?: string | null
          photo_is_generic?: boolean
          photo_license?: string | null
          photo_source?: string | null
          search_key?: string | null
          sort?: number
          trip_id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          city: string
          day_hint: string | null
          id: string
          is_avoid: boolean
          is_highlight: boolean
          is_optional: boolean
          kind: Database["public"]["Enums"]["site_kind"]
          name: string
          name_ja: string | null
          note: string | null
          photo_credit: string | null
          photo_file: string | null
          photo_license: string | null
          photo_source: string | null
          search_key: string | null
          sort: number
          trip_id: string
          url: string | null
        }
        Insert: {
          city: string
          day_hint?: string | null
          id?: string
          is_avoid?: boolean
          is_highlight?: boolean
          is_optional?: boolean
          kind: Database["public"]["Enums"]["site_kind"]
          name: string
          name_ja?: string | null
          note?: string | null
          photo_credit?: string | null
          photo_file?: string | null
          photo_license?: string | null
          photo_source?: string | null
          search_key?: string | null
          sort?: number
          trip_id: string
          url?: string | null
        }
        Update: {
          city?: string
          day_hint?: string | null
          id?: string
          is_avoid?: boolean
          is_highlight?: boolean
          is_optional?: boolean
          kind?: Database["public"]["Enums"]["site_kind"]
          name?: string
          name_ja?: string | null
          note?: string | null
          photo_credit?: string | null
          photo_file?: string | null
          photo_license?: string | null
          photo_source?: string | null
          search_key?: string | null
          sort?: number
          trip_id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_options: {
        Row: {
          activity_id: string
          cost_jpy: number | null
          duration_min: number
          from_place: string | null
          id: string
          is_selected: boolean
          label: string
          mode: string
          notes: string | null
          to_place: string | null
        }
        Insert: {
          activity_id: string
          cost_jpy?: number | null
          duration_min: number
          from_place?: string | null
          id?: string
          is_selected?: boolean
          label: string
          mode: string
          notes?: string | null
          to_place?: string | null
        }
        Update: {
          activity_id?: string
          cost_jpy?: number | null
          duration_min?: number
          from_place?: string | null
          id?: string
          is_selected?: boolean
          label?: string
          mode?: string
          notes?: string | null
          to_place?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_options_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          end_date: string
          id: string
          name: string
          start_date: string
        }
        Insert: {
          end_date: string
          id?: string
          name: string
          start_date: string
        }
        Update: {
          end_date?: string
          id?: string
          name?: string
          start_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_member: { Args: never; Returns: boolean }
      is_traveller: { Args: never; Returns: boolean }
    }
    Enums: {
      activity_status: "PLANNED" | "DONE" | "SKIPPED"
      activity_type:
        | "TRANSPORT"
        | "ONSEN"
        | "FOOD"
        | "SIGHT"
        | "SHOPPING"
        | "LODGING"
        | "ADMIN"
      food_kind: "PLACE" | "DISH"
      site_kind:
        | "SIGHT"
        | "ONSEN"
        | "MARKET"
        | "SHOPPING"
        | "THEATRE"
        | "FESTIVAL"
        | "GARDEN"
        | "REFERENCE"
        | "GYM"
      user_role: "traveller" | "viewer"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_status: ["PLANNED", "DONE", "SKIPPED"],
      activity_type: [
        "TRANSPORT",
        "ONSEN",
        "FOOD",
        "SIGHT",
        "SHOPPING",
        "LODGING",
        "ADMIN",
      ],
      food_kind: ["PLACE", "DISH"],
      site_kind: [
        "SIGHT",
        "ONSEN",
        "MARKET",
        "SHOPPING",
        "THEATRE",
        "FESTIVAL",
        "GARDEN",
        "REFERENCE",
        "GYM",
      ],
      user_role: ["traveller", "viewer"],
    },
  },
} as const

