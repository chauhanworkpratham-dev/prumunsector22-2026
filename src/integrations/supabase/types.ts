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
      ai_chats: {
        Row: {
          content: string
          created_at: string
          edition_id: string
          id: string
          registration_id: string
          role: string
        }
        Insert: {
          content: string
          created_at?: string
          edition_id: string
          id?: string
          registration_id: string
          role: string
        }
        Update: {
          content?: string
          created_at?: string
          edition_id?: string
          id?: string
          registration_id?: string
          role?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          body: string
          created_at: string
          edition_id: string
          id: string
          pinned: boolean
          published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          edition_id: string
          id?: string
          pinned?: boolean
          published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          edition_id?: string
          id?: string
          pinned?: boolean
          published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      archives: {
        Row: {
          created_at: string
          delegate_count: number
          edition_id: string
          edition_name: string
          event_date: string
          id: string
          snapshot: Json
        }
        Insert: {
          created_at?: string
          delegate_count?: number
          edition_id: string
          edition_name: string
          event_date: string
          id?: string
          snapshot: Json
        }
        Update: {
          created_at?: string
          delegate_count?: number
          edition_id?: string
          edition_name?: string
          event_date?: string
          id?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "archives_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          attendance_date: string
          edition_id: string
          id: string
          marked_at: string
          marked_by: string | null
          method: string
          registration_id: string
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Insert: {
          attendance_date?: string
          edition_id: string
          id?: string
          marked_at?: string
          marked_by?: string | null
          method?: string
          registration_id: string
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Update: {
          attendance_date?: string
          edition_id?: string
          id?: string
          marked_at?: string
          marked_by?: string | null
          method?: string
          registration_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "attendance_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      brochures: {
        Row: {
          created_at: string
          edition_id: string
          file_url: string
          id: string
          is_current: boolean
          title: string
          version: number
        }
        Insert: {
          created_at?: string
          edition_id: string
          file_url: string
          id?: string
          is_current?: boolean
          title: string
          version?: number
        }
        Update: {
          created_at?: string
          edition_id?: string
          file_url?: string
          id?: string
          is_current?: boolean
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "brochures_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      committees: {
        Row: {
          agenda: string
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["committee_difficulty"]
          edition_id: string
          id: string
          is_team_committee: boolean
          name: string
          portfolios: string[]
          room_number: string | null
          short_name: string
          sort_order: number
          team_size: number
          updated_at: string
        }
        Insert: {
          agenda: string
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["committee_difficulty"]
          edition_id: string
          id?: string
          is_team_committee?: boolean
          name: string
          portfolios?: string[]
          room_number?: string | null
          short_name: string
          sort_order?: number
          team_size?: number
          updated_at?: string
        }
        Update: {
          agenda?: string
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["committee_difficulty"]
          edition_id?: string
          id?: string
          is_team_committee?: boolean
          name?: string
          portfolios?: string[]
          room_number?: string | null
          short_name?: string
          sort_order?: number
          team_size?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "committees_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_persons: {
        Row: {
          created_at: string
          edition_id: string
          email: string | null
          id: string
          name: string
          phone: string
          role: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          edition_id: string
          email?: string | null
          id?: string
          name: string
          phone: string
          role?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          edition_id?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          role?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_persons_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      editions: {
        Row: {
          archived_at: string | null
          bank_details: string | null
          countdown_subtitle: string | null
          countdown_title: string
          created_at: string
          disclaimer_ai: string
          disclaimer_qr: string
          event_date: string
          event_end_date: string | null
          facebook_url: string | null
          header_logo_url: string | null
          hero_tagline: string
          id: string
          instagram_url: string | null
          is_active: boolean
          logo_url: string | null
          name: string
          payment_instructions: string | null
          payment_mode_delegate: string
          payment_mode_eb: string
          payment_mode_oc: string
          payment_qr_url: string | null
          qr_message_approved: string
          qr_message_delegate_pending: string
          qr_message_eb_pending: string
          qr_message_oc_pending: string
          qr_pending_title: string
          stat_committees: string
          stat_delegates: string
          stat_portfolios: string
          stat_years: string
          txt_auto_lock_notice: string
          txt_change_portfolio_btn: string
          txt_locked_awaiting_entry: string
          txt_needs_reselection: string
          txt_pay_cash_notice: string
          txt_pay_upi_btn: string
          txt_payment_rejected: string
          txt_receipt_uploaded: string
          txt_upload_receipt: string
          updated_at: string
          upi_id: string | null
          venue_address: string | null
          venue_name: string | null
          youtube_url: string | null
        }
        Insert: {
          archived_at?: string | null
          bank_details?: string | null
          countdown_subtitle?: string | null
          countdown_title?: string
          created_at?: string
          disclaimer_ai?: string
          disclaimer_qr?: string
          event_date: string
          event_end_date?: string | null
          facebook_url?: string | null
          header_logo_url?: string | null
          hero_tagline?: string
          id?: string
          instagram_url?: string | null
          is_active?: boolean
          logo_url?: string | null
          name: string
          payment_instructions?: string | null
          payment_mode_delegate?: string
          payment_mode_eb?: string
          payment_mode_oc?: string
          payment_qr_url?: string | null
          qr_message_approved?: string
          qr_message_delegate_pending?: string
          qr_message_eb_pending?: string
          qr_message_oc_pending?: string
          qr_pending_title?: string
          stat_committees?: string
          stat_delegates?: string
          stat_portfolios?: string
          stat_years?: string
          txt_auto_lock_notice?: string
          txt_change_portfolio_btn?: string
          txt_locked_awaiting_entry?: string
          txt_needs_reselection?: string
          txt_pay_cash_notice?: string
          txt_pay_upi_btn?: string
          txt_payment_rejected?: string
          txt_receipt_uploaded?: string
          txt_upload_receipt?: string
          updated_at?: string
          upi_id?: string | null
          venue_address?: string | null
          venue_name?: string | null
          youtube_url?: string | null
        }
        Update: {
          archived_at?: string | null
          bank_details?: string | null
          countdown_subtitle?: string | null
          countdown_title?: string
          created_at?: string
          disclaimer_ai?: string
          disclaimer_qr?: string
          event_date?: string
          event_end_date?: string | null
          facebook_url?: string | null
          header_logo_url?: string | null
          hero_tagline?: string
          id?: string
          instagram_url?: string | null
          is_active?: boolean
          logo_url?: string | null
          name?: string
          payment_instructions?: string | null
          payment_mode_delegate?: string
          payment_mode_eb?: string
          payment_mode_oc?: string
          payment_qr_url?: string | null
          qr_message_approved?: string
          qr_message_delegate_pending?: string
          qr_message_eb_pending?: string
          qr_message_oc_pending?: string
          qr_pending_title?: string
          stat_committees?: string
          stat_delegates?: string
          stat_portfolios?: string
          stat_years?: string
          txt_auto_lock_notice?: string
          txt_change_portfolio_btn?: string
          txt_locked_awaiting_entry?: string
          txt_needs_reselection?: string
          txt_pay_cash_notice?: string
          txt_pay_upi_btn?: string
          txt_payment_rejected?: string
          txt_receipt_uploaded?: string
          txt_upload_receipt?: string
          updated_at?: string
          upi_id?: string | null
          venue_address?: string | null
          venue_name?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      member_permissions: {
        Row: {
          created_at: string
          id: string
          level: string
          tab: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: string
          tab: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          tab?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      page_backgrounds: {
        Row: {
          blur: number
          blur_dark: number
          created_at: string
          edition_id: string
          fit: string
          fit_dark: string
          id: string
          image_url: string | null
          image_url_dark: string | null
          opacity: number
          opacity_dark: number
          page_key: string
          position: string
          position_dark: string
          updated_at: string
        }
        Insert: {
          blur?: number
          blur_dark?: number
          created_at?: string
          edition_id: string
          fit?: string
          fit_dark?: string
          id?: string
          image_url?: string | null
          image_url_dark?: string | null
          opacity?: number
          opacity_dark?: number
          page_key: string
          position?: string
          position_dark?: string
          updated_at?: string
        }
        Update: {
          blur?: number
          blur_dark?: number
          created_at?: string
          edition_id?: string
          fit?: string
          fit_dark?: string
          id?: string
          image_url?: string | null
          image_url_dark?: string | null
          opacity?: number
          opacity_dark?: number
          page_key?: string
          position?: string
          position_dark?: string
          updated_at?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          committee_id: string | null
          created_at: string
          eb_role: Database["public"]["Enums"]["eb_role"] | null
          edition_id: string
          email: string
          entry_verified_at: string | null
          entry_verified_by: string | null
          full_name: string
          grade: string
          id: string
          id_image_path: string
          needs_reselection: boolean
          payment_approved_at: string | null
          payment_approved_by: string | null
          payment_receipt_path: string | null
          payment_rejection_reason: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          payment_verified: boolean
          phone: string
          portfolio: string | null
          portfolio_changes_used: number
          portfolio_locked_at: string | null
          pref1_committee_id: string | null
          pref1_portfolio: string | null
          pref2_committee_id: string | null
          pref2_portfolio: string | null
          role: Database["public"]["Enums"]["participant_role"]
          school: string
          team_lead_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          committee_id?: string | null
          created_at?: string
          eb_role?: Database["public"]["Enums"]["eb_role"] | null
          edition_id: string
          email: string
          entry_verified_at?: string | null
          entry_verified_by?: string | null
          full_name: string
          grade: string
          id?: string
          id_image_path: string
          needs_reselection?: boolean
          payment_approved_at?: string | null
          payment_approved_by?: string | null
          payment_receipt_path?: string | null
          payment_rejection_reason?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_verified?: boolean
          phone: string
          portfolio?: string | null
          portfolio_changes_used?: number
          portfolio_locked_at?: string | null
          pref1_committee_id?: string | null
          pref1_portfolio?: string | null
          pref2_committee_id?: string | null
          pref2_portfolio?: string | null
          role?: Database["public"]["Enums"]["participant_role"]
          school: string
          team_lead_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          committee_id?: string | null
          created_at?: string
          eb_role?: Database["public"]["Enums"]["eb_role"] | null
          edition_id?: string
          email?: string
          entry_verified_at?: string | null
          entry_verified_by?: string | null
          full_name?: string
          grade?: string
          id?: string
          id_image_path?: string
          needs_reselection?: boolean
          payment_approved_at?: string | null
          payment_approved_by?: string | null
          payment_receipt_path?: string | null
          payment_rejection_reason?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_verified?: boolean
          phone?: string
          portfolio?: string | null
          portfolio_changes_used?: number
          portfolio_locked_at?: string | null
          pref1_committee_id?: string | null
          pref1_portfolio?: string | null
          pref2_committee_id?: string | null
          pref2_portfolio?: string | null
          role?: Database["public"]["Enums"]["participant_role"]
          school?: string
          team_lead_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_pref1_committee_id_fkey"
            columns: ["pref1_committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_pref2_committee_id_fkey"
            columns: ["pref2_committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_team_lead_id_fkey"
            columns: ["team_lead_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_items: {
        Row: {
          created_at: string
          day_label: string
          description: string | null
          edition_id: string
          end_time: string | null
          id: string
          location: string | null
          sort_order: number
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_label: string
          description?: string | null
          edition_id: string
          end_time?: string | null
          id?: string
          location?: string | null
          sort_order?: number
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_label?: string
          description?: string | null
          edition_id?: string
          end_time?: string | null
          id?: string
          location?: string | null
          sort_order?: number
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_items_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      secretariat_profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_invites: {
        Row: {
          assigned_portfolio: string
          claimed_registration_id: string | null
          committee_id: string
          created_at: string
          edition_id: string
          id: string
          invitee_email: string
          invitee_grade: string | null
          invitee_name: string
          team_lead_registration_id: string | null
        }
        Insert: {
          assigned_portfolio: string
          claimed_registration_id?: string | null
          committee_id: string
          created_at?: string
          edition_id: string
          id?: string
          invitee_email: string
          invitee_grade?: string | null
          invitee_name: string
          team_lead_registration_id?: string | null
        }
        Update: {
          assigned_portfolio?: string
          claimed_registration_id?: string | null
          committee_id?: string
          created_at?: string
          edition_id?: string
          id?: string
          invitee_email?: string
          invitee_grade?: string | null
          invitee_name?: string
          team_lead_registration_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_claimed_registration_id_fkey"
            columns: ["claimed_registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invites_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invites_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invites_team_lead_registration_id_fkey"
            columns: ["team_lead_registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      training_resources: {
        Row: {
          created_at: string
          description: string | null
          edition_id: string
          id: string
          sort_order: number
          title: string
          type: Database["public"]["Enums"]["training_resource_type"]
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          edition_id: string
          id?: string
          sort_order?: number
          title: string
          type: Database["public"]["Enums"]["training_resource_type"]
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          edition_id?: string
          id?: string
          sort_order?: number
          title?: string
          type?: Database["public"]["Enums"]["training_resource_type"]
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_resources_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          created_at: string
          description: string | null
          edition_id: string
          id: string
          recording_url: string | null
          scheduled_at: string
          topic: string
          updated_at: string
          zoom_link: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          edition_id: string
          id?: string
          recording_url?: string | null
          scheduled_at: string
          topic: string
          updated_at?: string
          zoom_link?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          edition_id?: string
          id?: string
          recording_url?: string | null
          scheduled_at?: string
          topic?: string
          updated_at?: string
          zoom_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_owner_secretariat: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "secretariat" | "delegate"
      attendance_status: "present" | "absent"
      committee_difficulty: "Beginner" | "Intermediate" | "Advanced"
      eb_role: "chairperson" | "vice_chairperson" | "rapporteur"
      participant_role: "delegate" | "executive_board" | "organising_committee"
      payment_status: "none" | "pending" | "approved" | "rejected"
      training_resource_type: "video" | "pdf" | "note" | "link"
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
      app_role: ["secretariat", "delegate"],
      attendance_status: ["present", "absent"],
      committee_difficulty: ["Beginner", "Intermediate", "Advanced"],
      eb_role: ["chairperson", "vice_chairperson", "rapporteur"],
      participant_role: ["delegate", "executive_board", "organising_committee"],
      payment_status: ["none", "pending", "approved", "rejected"],
      training_resource_type: ["video", "pdf", "note", "link"],
    },
  },
} as const
