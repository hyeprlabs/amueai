// Generated via `mcp__Supabase__generate_typescript_types` against the
// AmueAI project (vwacvviffixddrxbxnkc). Regenerate after every migration —
// do not hand-edit.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.17";
  };
  public: {
    Tables: {
      agents: {
        Row: {
          allowed_origins: string[];
          created_at: string;
          fallback_message: string;
          id: string;
          model: string;
          name: string;
          org_id: string;
          remove_branding: boolean;
          system_prompt: string;
          temperature: number;
        };
        Insert: {
          allowed_origins?: string[];
          created_at?: string;
          fallback_message?: string;
          id?: string;
          model?: string;
          name: string;
          org_id: string;
          remove_branding?: boolean;
          system_prompt?: string;
          temperature?: number;
        };
        Update: {
          allowed_origins?: string[];
          created_at?: string;
          fallback_message?: string;
          id?: string;
          model?: string;
          name?: string;
          org_id?: string;
          remove_branding?: boolean;
          system_prompt?: string;
          temperature?: number;
        };
        Relationships: [
          {
            foreignKeyName: "agents_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["clerk_org_id"];
          },
        ];
      };
      chunks: {
        Row: {
          content: string;
          embedding: string | null;
          id: string;
          org_id: string;
          source_id: string;
        };
        Insert: {
          content: string;
          embedding?: string | null;
          id?: string;
          org_id: string;
          source_id: string;
        };
        Update: {
          content?: string;
          embedding?: string | null;
          id?: string;
          org_id?: string;
          source_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chunks_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: {
          agent_id: string;
          created_at: string;
          id: string;
          org_id: string;
          visitor_id: string;
        };
        Insert: {
          agent_id: string;
          created_at?: string;
          id?: string;
          org_id: string;
          visitor_id: string;
        };
        Update: {
          agent_id?: string;
          created_at?: string;
          id?: string;
          org_id?: string;
          visitor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          agent_id: string;
          content: string;
          conversation_id: string;
          created_at: string;
          credits_charged: number;
          id: string;
          org_id: string;
          role: string;
        };
        Insert: {
          agent_id: string;
          content: string;
          conversation_id: string;
          created_at?: string;
          credits_charged?: number;
          id?: string;
          org_id: string;
          role: string;
        };
        Update: {
          agent_id?: string;
          content?: string;
          conversation_id?: string;
          created_at?: string;
          credits_charged?: number;
          id?: string;
          org_id?: string;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["clerk_org_id"];
          },
        ];
      };
      organizations: {
        Row: {
          billing_email: string | null;
          cancel_at_period_end: boolean;
          clerk_org_id: string;
          created_at: string;
          credit_alert_level: number;
          credits_period: string | null;
          deleted_at: string | null;
          message_limit: number;
          messages_used: number;
          name: string;
          period_end: string | null;
          plan: string;
          plan_credits: number;
          polar_customer_id: string | null;
          polar_subscription_id: string | null;
          status: string;
          topup_credits: number;
          usage_period_start: string;
          vat_id: string | null;
        };
        Insert: {
          billing_email?: string | null;
          cancel_at_period_end?: boolean;
          clerk_org_id: string;
          created_at?: string;
          credit_alert_level?: number;
          credits_period?: string | null;
          deleted_at?: string | null;
          message_limit?: number;
          messages_used?: number;
          name: string;
          period_end?: string | null;
          plan?: string;
          plan_credits?: number;
          polar_customer_id?: string | null;
          polar_subscription_id?: string | null;
          status?: string;
          topup_credits?: number;
          usage_period_start?: string;
          vat_id?: string | null;
        };
        Update: {
          billing_email?: string | null;
          cancel_at_period_end?: boolean;
          clerk_org_id?: string;
          created_at?: string;
          credit_alert_level?: number;
          credits_period?: string | null;
          deleted_at?: string | null;
          message_limit?: number;
          messages_used?: number;
          name?: string;
          period_end?: string | null;
          plan?: string;
          plan_credits?: number;
          polar_customer_id?: string | null;
          polar_subscription_id?: string | null;
          status?: string;
          topup_credits?: number;
          usage_period_start?: string;
          vat_id?: string | null;
        };
        Relationships: [];
      };
      sources: {
        Row: {
          agent_id: string;
          created_at: string;
          error_message: string | null;
          id: string;
          label: string;
          org_id: string;
          raw_content: string | null;
          status: string;
          storage_path: string | null;
          type: string;
          updated_at: string;
        };
        Insert: {
          agent_id: string;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          label: string;
          org_id: string;
          raw_content?: string | null;
          status?: string;
          storage_path?: string | null;
          type: string;
          updated_at?: string;
        };
        Update: {
          agent_id?: string;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          label?: string;
          org_id?: string;
          raw_content?: string | null;
          status?: string;
          storage_path?: string | null;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sources_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
        ];
      };
      webhook_events: {
        Row: {
          error: string | null;
          id: string;
          payload: Json;
          processed_at: string | null;
          provider: string;
          received_at: string;
          type: string;
        };
        Insert: {
          error?: string | null;
          id: string;
          payload: Json;
          processed_at?: string | null;
          provider: string;
          received_at?: string;
          type: string;
        };
        Update: {
          error?: string | null;
          id?: string;
          payload?: Json;
          processed_at?: string | null;
          provider?: string;
          received_at?: string;
          type?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_topup_credits: {
        Args: { p_amount: number; p_org_id: string };
        Returns: number;
      };
      claim_credit_alert: {
        Args: { p_level: number; p_org_id: string };
        Returns: boolean;
      };
      claim_webhook_event: {
        Args: {
          p_id: string;
          p_payload: Json;
          p_provider: string;
          p_type: string;
        };
        Returns: boolean;
      };
      grant_monthly_credits: { Args: never; Returns: number };
      increment_message_usage: { Args: { p_org_id: string }; Returns: boolean };
      match_chunks: {
        Args: {
          match_agent_id: string;
          match_count?: number;
          query_embedding: string;
        };
        Returns: {
          content: string;
          similarity: number;
          source_id: string;
        }[];
      };
      spend_credits: {
        Args: { p_amount: number; p_org_id: string };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
