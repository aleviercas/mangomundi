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
      affiliate_clicks: {
        Row: {
          amount: number | null
          created_at: string
          from_currency: string | null
          id: string
          provider_slug: string
          referrer: string | null
          segment: string | null
          to_currency: string | null
          user_agent: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          from_currency?: string | null
          id?: string
          provider_slug: string
          referrer?: string | null
          segment?: string | null
          to_currency?: string | null
          user_agent?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          from_currency?: string | null
          id?: string
          provider_slug?: string
          referrer?: string | null
          segment?: string | null
          to_currency?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          audience: string
          content_md: string | null
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          locale: string
          published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
          vertical: Database["public"]["Enums"]["provider_vertical"] | null
        }
        Insert: {
          audience?: string
          content_md?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          locale?: string
          published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
          vertical?: Database["public"]["Enums"]["provider_vertical"] | null
        }
        Update: {
          audience?: string
          content_md?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          locale?: string
          published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
          vertical?: Database["public"]["Enums"]["provider_vertical"] | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      clicks_tracking: {
        Row: {
          amount: number
          commission_earned: number
          created_at: string
          id: string
          provider: string
          source_currency: string
          status: string
          target_currency: string
        }
        Insert: {
          amount: number
          commission_earned?: number
          created_at?: string
          id?: string
          provider: string
          source_currency: string
          status?: string
          target_currency: string
        }
        Update: {
          amount?: number
          commission_earned?: number
          created_at?: string
          id?: string
          provider?: string
          source_currency?: string
          status?: string
          target_currency?: string
        }
        Relationships: []
      }
      enterprise_leads: {
        Row: {
          amount: number | null
          consent_timestamp: string | null
          created_at: string
          email: string
          feature_source: string | null
          from_currency: string | null
          id: string
          locale: string | null
          monthly_volume: number | null
          privacy_consent: boolean
          receiving_country: string | null
          request_id: string | null
          sector: string | null
          segment: string | null
          sending_country: string | null
          status: string
          to_currency: string | null
        }
        Insert: {
          amount?: number | null
          consent_timestamp?: string | null
          created_at?: string
          email: string
          feature_source?: string | null
          from_currency?: string | null
          id?: string
          locale?: string | null
          monthly_volume?: number | null
          privacy_consent?: boolean
          receiving_country?: string | null
          request_id?: string | null
          sector?: string | null
          segment?: string | null
          sending_country?: string | null
          status?: string
          to_currency?: string | null
        }
        Update: {
          amount?: number | null
          consent_timestamp?: string | null
          created_at?: string
          email?: string
          feature_source?: string | null
          from_currency?: string | null
          id?: string
          locale?: string | null
          monthly_volume?: number | null
          privacy_consent?: boolean
          receiving_country?: string | null
          request_id?: string | null
          sector?: string | null
          segment?: string | null
          sending_country?: string | null
          status?: string
          to_currency?: string | null
        }
        Relationships: []
      }
      fx_rates: {
        Row: {
          affiliate_url_template: string | null
          fee: number
          from_currency: string
          id: string
          is_local_fx: boolean
          max_amount: number | null
          min_amount: number | null
          provider_slug: string
          public_spread_percent: number
          rate: number
          receiving_country: string | null
          sending_country: string | null
          to_currency: string
          updated_at: string
        }
        Insert: {
          affiliate_url_template?: string | null
          fee?: number
          from_currency: string
          id?: string
          is_local_fx?: boolean
          max_amount?: number | null
          min_amount?: number | null
          provider_slug: string
          public_spread_percent?: number
          rate: number
          receiving_country?: string | null
          sending_country?: string | null
          to_currency: string
          updated_at?: string
        }
        Update: {
          affiliate_url_template?: string | null
          fee?: number
          from_currency?: string
          id?: string
          is_local_fx?: boolean
          max_amount?: number | null
          min_amount?: number | null
          provider_slug?: string
          public_spread_percent?: number
          rate?: number
          receiving_country?: string | null
          sending_country?: string | null
          to_currency?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          monthly_volume: string | null
          name: string
          source: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          monthly_volume?: string | null
          name: string
          source?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          monthly_volume?: string | null
          name?: string
          source?: string | null
        }
        Relationships: []
      }
      providers: {
        Row: {
          active: boolean
          affiliate_url: string
          audience: string
          bank_transfer_available: boolean | null
          business_focus_score: number | null
          card_payout_available: boolean | null
          cash_pickup_available: boolean | null
          countries_covered: number | null
          created_at: string
          delivery_minutes: number | null
          featured: boolean
          fee_fixed: number
          fee_percent: number
          fee_tiers: Json | null
          has_exclusive_deal: boolean | null
          id: string
          logo_emoji: string | null
          max_amount: number | null
          min_amount: number | null
          mobile_app_rating: number | null
          name: string
          notes: string | null
          promo_text: string | null
          provider_type: string | null
          rates_last_updated: string | null
          regulator: string | null
          review_count: number | null
          segment: string
          slug: string
          speed_hours: number
          sponsored: boolean
          sponsored_rank: number | null
          spread_percent: number
          supported_corridors: string[] | null
          supports_large_tickets: boolean
          transparency_score: number | null
          trust_score: number | null
          trust_score_checked_at: string | null
          trust_score_previous: number | null
          updated_at: string
          vertical: Database["public"]["Enums"]["provider_vertical"]
          website_url: string | null
        }
        Insert: {
          active?: boolean
          affiliate_url: string
          audience?: string
          bank_transfer_available?: boolean | null
          business_focus_score?: number | null
          card_payout_available?: boolean | null
          cash_pickup_available?: boolean | null
          countries_covered?: number | null
          created_at?: string
          delivery_minutes?: number | null
          featured?: boolean
          fee_fixed?: number
          fee_percent?: number
          fee_tiers?: Json | null
          has_exclusive_deal?: boolean | null
          id?: string
          logo_emoji?: string | null
          max_amount?: number | null
          min_amount?: number | null
          mobile_app_rating?: number | null
          name: string
          notes?: string | null
          promo_text?: string | null
          provider_type?: string | null
          rates_last_updated?: string | null
          regulator?: string | null
          review_count?: number | null
          segment?: string
          slug: string
          speed_hours?: number
          sponsored?: boolean
          sponsored_rank?: number | null
          spread_percent?: number
          supported_corridors?: string[] | null
          supports_large_tickets?: boolean
          transparency_score?: number | null
          trust_score?: number | null
          trust_score_checked_at?: string | null
          trust_score_previous?: number | null
          updated_at?: string
          vertical?: Database["public"]["Enums"]["provider_vertical"]
          website_url?: string | null
        }
        Update: {
          active?: boolean
          affiliate_url?: string
          audience?: string
          bank_transfer_available?: boolean | null
          business_focus_score?: number | null
          card_payout_available?: boolean | null
          cash_pickup_available?: boolean | null
          countries_covered?: number | null
          created_at?: string
          delivery_minutes?: number | null
          featured?: boolean
          fee_fixed?: number
          fee_percent?: number
          fee_tiers?: Json | null
          has_exclusive_deal?: boolean | null
          id?: string
          logo_emoji?: string | null
          max_amount?: number | null
          min_amount?: number | null
          mobile_app_rating?: number | null
          name?: string
          notes?: string | null
          promo_text?: string | null
          provider_type?: string | null
          rates_last_updated?: string | null
          regulator?: string | null
          review_count?: number | null
          segment?: string
          slug?: string
          speed_hours?: number
          sponsored?: boolean
          sponsored_rank?: number | null
          spread_percent?: number
          supported_corridors?: string[] | null
          supports_large_tickets?: boolean
          transparency_score?: number | null
          trust_score?: number | null
          trust_score_checked_at?: string | null
          trust_score_previous?: number | null
          updated_at?: string
          vertical?: Database["public"]["Enums"]["provider_vertical"]
          website_url?: string | null
        }
        Relationships: []
      }
      rate_alerts: {
        Row: {
          created_at: string
          email: string
          id: string
          source_currency: string
          target_currency: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source_currency: string
          target_currency: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source_currency?: string
          target_currency?: string
        }
        Relationships: []
      }
      rate_cache: {
        Row: {
          base: string
          fetched_at: string
          id: string
          rates: Json
          source: string
          updated_at: string
        }
        Insert: {
          base?: string
          fetched_at?: string
          id: string
          rates?: Json
          source?: string
          updated_at?: string
        }
        Update: {
          base?: string
          fetched_at?: string
          id?: string
          rates?: Json
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      retail_leads: {
        Row: {
          affiliate_code: string
          amount: number
          consent_timestamp: string
          created_at: string
          email: string
          from_currency: string
          id: string
          locale: string
          privacy_consent: boolean
          provider_slug: string | null
          receiving_country: string | null
          sending_country: string | null
          status: string
          to_currency: string
        }
        Insert: {
          affiliate_code?: string
          amount: number
          consent_timestamp?: string
          created_at?: string
          email: string
          from_currency: string
          id?: string
          locale?: string
          privacy_consent?: boolean
          provider_slug?: string | null
          receiving_country?: string | null
          sending_country?: string | null
          status?: string
          to_currency: string
        }
        Update: {
          affiliate_code?: string
          amount?: number
          consent_timestamp?: string
          created_at?: string
          email?: string
          from_currency?: string
          id?: string
          locale?: string
          privacy_consent?: boolean
          provider_slug?: string | null
          receiving_country?: string | null
          sending_country?: string | null
          status?: string
          to_currency?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
    }
    Enums: {
      app_role: "admin" | "user"
      provider_vertical:
        | "fx"
        | "insurance"
        | "saas"
        | "brokers"
        | "shipping"
        | "lending"
        | "cloud"
        | "payments_infra"
        | "legal"
        | "recruitment"
        | "energy"
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
      app_role: ["admin", "user"],
      provider_vertical: [
        "fx",
        "insurance",
        "saas",
        "brokers",
        "shipping",
        "lending",
        "cloud",
        "payments_infra",
        "legal",
        "recruitment",
        "energy",
      ],
    },
  },
} as const
