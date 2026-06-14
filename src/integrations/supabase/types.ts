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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      account_deletions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          scheduled_for: string
          status: string
          user_email: string | null
          user_full_name: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          scheduled_for?: string
          status?: string
          user_email?: string | null
          user_full_name?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          scheduled_for?: string
          status?: string
          user_email?: string | null
          user_full_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          country: string | null
          created_at: string
          event_name: string
          id: string
          metadata: Json | null
          page_path: string | null
          referrer: string | null
          session_id: string | null
          source: string | null
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          event_name: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          event_name?: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_config: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      cookie_consents: {
        Row: {
          anonymous_id: string
          consent_type: string
          created_at: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          anonymous_id: string
          consent_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string
          consent_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      crash_logs: {
        Row: {
          created_at: string
          error_message: string
          error_stack: string | null
          id: string
          page_url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message: string
          error_stack?: string | null
          id?: string
          page_url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string
          error_stack?: string | null
          id?: string
          page_url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      dm_conversations: {
        Row: {
          created_at: string
          id: string
          initiator_id: string
          recipient_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          initiator_id: string
          recipient_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          initiator_id?: string
          recipient_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      dm_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "dm_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          enabled: boolean
          feature_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          feature_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          feature_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flag_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          reason: string | null
          target_user_id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          reason?: string | null
          target_user_id: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          target_user_id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          liked_id: string
          liker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          liked_id: string
          liker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          liked_id?: string
          liker_id?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          id: string
          type: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          type?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          match_id: string
          read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          match_id: string
          read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          match_id?: string
          read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          related_match_id: string | null
          related_user_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          related_match_id?: string | null
          related_user_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          related_match_id?: string | null
          related_user_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      page_visits: {
        Row: {
          browser: string | null
          country: string | null
          created_at: string
          device_type: string | null
          id: string
          ip_address: string | null
          os: string | null
          page_path: string | null
          referrer: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          os?: string | null
          page_path?: string | null
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          os?: string | null
          page_path?: string | null
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profile_boosts: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          education: string | null
          email: string | null
          full_name: string
          gender: string | null
          height_cm: number | null
          id: string
          interests: string[] | null
          international_preference: boolean | null
          is_flagged: boolean
          is_premium: boolean | null
          is_verified: boolean | null
          language: string | null
          last_seen: string | null
          onboarding_completed: boolean | null
          onboarding_step: number
          photos: string[] | null
          preferred_max_age: number | null
          preferred_min_age: number | null
          province: string | null
          relationship_intent: string | null
          relationship_status: string | null
          relocation_intent: string | null
          updated_at: string
          user_type: string | null
          want_children: string | null
          weight_kg: number | null
          welcome_email_sent: boolean
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          education?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          height_cm?: number | null
          id: string
          interests?: string[] | null
          international_preference?: boolean | null
          is_flagged?: boolean
          is_premium?: boolean | null
          is_verified?: boolean | null
          language?: string | null
          last_seen?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number
          photos?: string[] | null
          preferred_max_age?: number | null
          preferred_min_age?: number | null
          province?: string | null
          relationship_intent?: string | null
          relationship_status?: string | null
          relocation_intent?: string | null
          updated_at?: string
          user_type?: string | null
          want_children?: string | null
          weight_kg?: number | null
          welcome_email_sent?: boolean
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          education?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          height_cm?: number | null
          id?: string
          interests?: string[] | null
          international_preference?: boolean | null
          is_flagged?: boolean
          is_premium?: boolean | null
          is_verified?: boolean | null
          language?: string | null
          last_seen?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number
          photos?: string[] | null
          preferred_max_age?: number | null
          preferred_min_age?: number | null
          province?: string | null
          relationship_intent?: string | null
          relationship_status?: string | null
          relocation_intent?: string | null
          updated_at?: string
          user_type?: string | null
          want_children?: string | null
          weight_kg?: number | null
          welcome_email_sent?: boolean
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_id: string
          reporter_id: string
          status: string | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
          status?: string | null
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
          status?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          plan: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verifications: {
        Row: {
          created_at: string
          document_url: string | null
          id: string
          pose_instruction: string | null
          reviewed_at: string | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_url?: string | null
          id?: string
          pose_instruction?: string | null
          reviewed_at?: string | null
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_url?: string | null
          id?: string
          pose_instruction?: string | null
          reviewed_at?: string | null
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      video_call_sessions: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          match_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          match_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          match_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_call_signals: {
        Row: {
          callee_id: string
          caller_id: string
          created_at: string
          id: string
          match_id: string
          room_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          callee_id: string
          caller_id: string
          created_at?: string
          id?: string
          match_id: string
          room_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          callee_id?: string
          caller_id?: string
          created_at?: string
          id?: string
          match_id?: string
          room_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string | null
          education: string | null
          full_name: string | null
          gender: string | null
          height_cm: number | null
          id: string | null
          interests: string[] | null
          international_preference: boolean | null
          is_premium: boolean | null
          is_verified: boolean | null
          language: string | null
          last_seen: string | null
          onboarding_completed: boolean | null
          photos: string[] | null
          province: string | null
          relationship_intent: string | null
          relationship_status: string | null
          relocation_intent: string | null
          user_type: string | null
          want_children: string | null
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          education?: string | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string | null
          interests?: string[] | null
          international_preference?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          language?: string | null
          last_seen?: string | null
          onboarding_completed?: boolean | null
          photos?: string[] | null
          province?: string | null
          relationship_intent?: string | null
          relationship_status?: string | null
          relocation_intent?: string | null
          user_type?: string | null
          want_children?: string | null
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          education?: string | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string | null
          interests?: string[] | null
          international_preference?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          language?: string | null
          last_seen?: string | null
          onboarding_completed?: boolean | null
          photos?: string[] | null
          province?: string | null
          relationship_intent?: string | null
          relationship_status?: string | null
          relocation_intent?: string | null
          user_type?: string | null
          want_children?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_flag_user: {
        Args: { reason: string; target_user_id: string }
        Returns: number
      }
      admin_get_recent_activity: {
        Args: { filter_type?: string; result_limit?: number }
        Returns: {
          activity_id: string
          activity_type: string
          actor_email: string
          actor_id: string
          actor_name: string
          content: string
          created_at: string
          meta: Json
          target_email: string
          target_id: string
          target_name: string
        }[]
      }
      admin_get_user_activity: {
        Args: { target_user_id: string }
        Returns: Json
      }
      admin_remove_photo: {
        Args: { photo_url: string; reason?: string; target_user_id: string }
        Returns: undefined
      }
      admin_unflag_user:
        | { Args: { target_user_id: string }; Returns: undefined }
        | {
            Args: { reason?: string; target_user_id: string }
            Returns: undefined
          }
      browse_profiles: {
        Args: {
          exclude_ids?: string[]
          filter_country?: string
          filter_gender?: string
          filter_max_age?: number
          filter_min_age?: number
          filter_user_type?: string
          result_limit?: number
          result_offset?: number
        }
        Returns: {
          age: number
          avatar_url: string
          bio: string
          city: string
          country: string
          created_at: string
          education: string
          full_name: string
          gender: string
          height_cm: number
          id: string
          interests: string[]
          international_preference: boolean
          is_premium: boolean
          is_verified: boolean
          language: string
          last_seen: string
          photos: string[]
          province: string
          relationship_intent: string
          relationship_status: string
          relocation_intent: string
          user_type: string
          want_children: string
          weight_kg: number
        }[]
      }
      cleanup_stale_video_signals: { Args: never; Returns: undefined }
      create_match_if_mutual: {
        Args: { other_user_id: string }
        Returns: string
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_admin_emails: {
        Args: never
        Returns: {
          email: string
        }[]
      }
      get_monthly_video_usage: { Args: { p_user_id: string }; Returns: number }
      get_profile_by_id: {
        Args: { profile_id: string }
        Returns: {
          age: number
          avatar_url: string
          bio: string
          city: string
          country: string
          created_at: string
          education: string
          full_name: string
          gender: string
          height_cm: number
          id: string
          interests: string[]
          international_preference: boolean
          is_premium: boolean
          is_verified: boolean
          language: string
          last_seen: string
          photos: string[]
          province: string
          relationship_intent: string
          relationship_status: string
          relocation_intent: string
          user_type: string
          want_children: string
          weight_kg: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
