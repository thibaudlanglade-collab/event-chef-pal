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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      checklist_templates: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string
          tasks: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          tasks?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          tasks?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      confirmation_requests: {
        Row: {
          created_at: string
          id: string
          responded_at: string | null
          respondent_firstname: string | null
          respondent_lastname: string | null
          session_id: string
          status: string
          team_member_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          responded_at?: string | null
          respondent_firstname?: string | null
          respondent_lastname?: string | null
          session_id: string
          status?: string
          team_member_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          responded_at?: string | null
          respondent_firstname?: string | null
          respondent_lastname?: string | null
          session_id?: string
          status?: string
          team_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "confirmation_requests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "confirmation_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmation_requests_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      confirmation_sessions: {
        Row: {
          created_at: string
          event_id: string
          expires_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          expires_at: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          expires_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "confirmation_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      conflicts: {
        Row: {
          detected_at: string
          event_id_1: string
          event_id_2: string
          id: string
          resolved: boolean
          team_member_id: string
        }
        Insert: {
          detected_at?: string
          event_id_1: string
          event_id_2: string
          id?: string
          resolved?: boolean
          team_member_id: string
        }
        Update: {
          detected_at?: string
          event_id_1?: string
          event_id_2?: string
          id?: string
          resolved?: boolean
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conflicts_event_id_1_fkey"
            columns: ["event_id_1"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflicts_event_id_2_fkey"
            columns: ["event_id_2"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflicts_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      email_settings: {
        Row: {
          auto_triage_enabled: boolean | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_triage_enabled?: boolean | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_triage_enabled?: boolean | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      emails: {
        Row: {
          body: string
          calendar_check: Json | null
          category: string | null
          client_id: string | null
          created_at: string | null
          email_provider_id: string
          event_id: string | null
          extracted_info: Json | null
          final_response_text: string | null
          id: string
          is_urgent: boolean | null
          received_at: string
          response_sent: boolean | null
          response_sent_at: string | null
          sender_email: string
          sender_name: string | null
          subject: string
          suggested_response: string | null
          upsell_suggestions: Json | null
          user_id: string
        }
        Insert: {
          body: string
          calendar_check?: Json | null
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          email_provider_id: string
          event_id?: string | null
          extracted_info?: Json | null
          final_response_text?: string | null
          id?: string
          is_urgent?: boolean | null
          received_at: string
          response_sent?: boolean | null
          response_sent_at?: string | null
          sender_email: string
          sender_name?: string | null
          subject: string
          suggested_response?: string | null
          upsell_suggestions?: Json | null
          user_id: string
        }
        Update: {
          body?: string
          calendar_check?: Json | null
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          email_provider_id?: string
          event_id?: string | null
          extracted_info?: Json | null
          final_response_text?: string | null
          id?: string
          is_urgent?: boolean | null
          received_at?: string
          response_sent?: boolean | null
          response_sent_at?: string | null
          sender_email?: string
          sender_name?: string | null
          subject?: string
          suggested_response?: string | null
          upsell_suggestions?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_staff: {
        Row: {
          confirmation_status: string
          created_at: string
          event_id: string
          id: string
          role_assigned: string | null
          team_member_id: string
        }
        Insert: {
          confirmation_status?: string
          created_at?: string
          event_id: string
          id?: string
          role_assigned?: string | null
          team_member_id: string
        }
        Update: {
          confirmation_status?: string
          created_at?: string
          event_id?: string
          id?: string
          role_assigned?: string | null
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_staff_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_staff_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          deadline: string
          event_id: string
          id: string
          status: string | null
          task_name: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          deadline: string
          event_id: string
          id?: string
          status?: string | null
          task_name: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          deadline?: string
          event_id?: string
          id?: string
          status?: string | null
          task_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          client_id: string | null
          created_at: string
          date: string
          end_date: string | null
          guest_count: number | null
          id: string
          name: string
          notes: string | null
          status: string
          time: string | null
          type: string
          user_id: string
          venue: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          date: string
          end_date?: string | null
          guest_count?: number | null
          id?: string
          name: string
          notes?: string | null
          status?: string
          time?: string | null
          type?: string
          user_id: string
          venue?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          date?: string
          end_date?: string | null
          guest_count?: number | null
          id?: string
          name?: string
          notes?: string | null
          status?: string
          time?: string | null
          type?: string
          user_id?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_queue: {
        Row: {
          auto_reply: string | null
          body: string | null
          category: string | null
          created_at: string
          id: string
          sender: string | null
          status: string
          subject: string | null
          user_id: string
        }
        Insert: {
          auto_reply?: string | null
          body?: string | null
          category?: string | null
          created_at?: string
          id?: string
          sender?: string | null
          status?: string
          subject?: string | null
          user_id: string
        }
        Update: {
          auto_reply?: string | null
          body?: string | null
          category?: string | null
          created_at?: string
          id?: string
          sender?: string | null
          status?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      master_products: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          name: string
          reference_unit: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
          reference_unit?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
          reference_unit?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      oauth_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          email_address: string
          expires_at: string
          id: string
          provider: string
          refresh_token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          email_address: string
          expires_at: string
          id?: string
          provider: string
          refresh_token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          email_address?: string
          expires_at?: string
          id?: string
          provider?: string
          refresh_token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          client_id: string | null
          created_at: string
          event_id: string | null
          id: string
          items: Json
          notes: string | null
          status: string
          subtotal: number | null
          total_ttc: number | null
          tva_rate: number | null
          user_id: string
          validity_date: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          items?: Json
          notes?: string | null
          status?: string
          subtotal?: number | null
          total_ttc?: number | null
          tva_rate?: number | null
          user_id: string
          validity_date?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          items?: Json
          notes?: string | null
          status?: string
          subtotal?: number | null
          total_ttc?: number | null
          tva_rate?: number | null
          user_id?: string
          validity_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_items: {
        Row: {
          category: string | null
          created_at: string
          current_qty: number | null
          id: string
          min_threshold: number | null
          name: string
          unit: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_qty?: number | null
          id?: string
          min_threshold?: number | null
          name: string
          unit?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current_qty?: number | null
          id?: string
          min_threshold?: number | null
          name?: string
          unit?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          movement_type: string
          note: string | null
          qty: number
          stock_item_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          movement_type?: string
          note?: string | null
          qty: number
          stock_item_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          movement_type?: string
          note?: string | null
          qty?: number
          stock_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          conversion_factor: number | null
          current_price: number | null
          external_ref: string | null
          id: string
          last_update: string | null
          master_product_id: string | null
          raw_label: string
          raw_unit: string | null
          supplier_id: string | null
        }
        Insert: {
          conversion_factor?: number | null
          current_price?: number | null
          external_ref?: string | null
          id?: string
          last_update?: string | null
          master_product_id?: string | null
          raw_label: string
          raw_unit?: string | null
          supplier_id?: string | null
        }
        Update: {
          conversion_factor?: number | null
          current_price?: number | null
          external_ref?: string | null
          id?: string
          last_update?: string | null
          master_product_id?: string | null
          raw_label?: string
          raw_unit?: string | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_master_product_id_fkey"
            columns: ["master_product_id"]
            isOneToOne: false
            referencedRelation: "master_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          created_at: string | null
          delivery_info: string | null
          franco_threshold: number | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delivery_info?: string | null
          franco_threshold?: number | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          delivery_info?: string | null
          franco_threshold?: number | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          hourly_rate: number | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          role: string | null
          skills: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          hourly_rate?: number | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          skills?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          hourly_rate?: number | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          skills?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          company_name: string
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          pricing_range: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_name?: string
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          pricing_range?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          pricing_range?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      webhook_configs: {
        Row: {
          created_at: string
          feature_name: string
          id: string
          is_active: boolean | null
          user_id: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          feature_name: string
          id?: string
          is_active?: boolean | null
          user_id: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          feature_name?: string
          id?: string
          is_active?: boolean | null
          user_id?: string
          webhook_url?: string
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
