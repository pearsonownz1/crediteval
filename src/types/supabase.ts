export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      orders: {
        Row: {
          created_at: string
          document_paths: Json | null
          email: string | null
          first_name: string | null
          id: number
          last_name: string | null
          phone: string | null
          services: Json | null
          status: string | null
          stripe_payment_intent_id: string | null
          total_amount: number | null
        }
        Insert: {
          created_at?: string
          document_paths?: Json | null
          email?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          phone?: string | null
          services?: Json | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          total_amount?: number | null
        }
        Update: {
          created_at?: string
          document_paths?: Json | null
          email?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          phone?: string | null
          services?: Json | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          total_amount?: number | null
        }
        Relationships: []
      }
      orders_dev: {
        Row: {
          created_at: string | null
          document_paths: Json | null
          email: string | null
          first_name: string | null
          id: number | null
          last_name: string | null
          phone: string | null
          services: Json | null
          status: string | null
          stripe_payment_intent_id: string | null
          total_amount: number | null
        }
        Insert: {
          created_at?: string | null
          document_paths?: Json | null
          email?: string | null
          first_name?: string | null
          id?: number | null
          last_name?: string | null
          phone?: string | null
          services?: Json | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          total_amount?: number | null
        }
        Update: {
          created_at?: string | null
          document_paths?: Json | null
          email?: string | null
          first_name?: string | null
          id?: number | null
          last_name?: string | null
          phone?: string | null
          services?: Json | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          total_amount?: number | null
        }
        Relationships: []
      }
      orders_dev1: {
        Row: {
          created_at: string
          document_paths: Json | null
          email: string | null
          first_name: string | null
          id: number
          last_name: string | null
          services: Json | null
          status: string | null
          stripe_payment_intent_id: string | null
          total_amount: number | null
        }
        Insert: {
          created_at?: string
          document_paths?: Json | null
          email?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          services?: Json | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          total_amount?: number | null
        }
        Update: {
          created_at?: string
          document_paths?: Json | null
          email?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          services?: Json | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          total_amount?: number | null
        }
        Relationships: []
      }
      quotes: { // Manually corrected based on user feedback (using 'name' and 'email')
        Row: {
          name: string // Changed from client_name
          created_at: string
          email: string // Using 'email' as requested
          expires_at: string | null // Added based on migration
          id: string
          price: number // Added based on migration
          service_type: string // Added based on migration
          staff_id: string | null // Added based on migration
          status: string
          stripe_checkout_session_id: string | null // Added based on migration
        }
        Insert: {
          name: string // Changed from client_name
          created_at?: string
          email: string // Using 'email'
          expires_at?: string | null // Added
          id?: string
          price: number // Added
          service_type: string // Added
          staff_id?: string | null // Added
          status?: string
          stripe_checkout_session_id?: string | null // Added
        }
        Update: {
          name?: string // Changed from client_name
          created_at?: string
          email?: string // Using 'email'
          expires_at?: string | null // Added
          id?: string
          price?: number // Added
          service_type?: string // Added
          staff_id?: string | null // Added
          status?: string
          stripe_checkout_session_id?: string | null // Added
        }
        Relationships: [ // Added relationship based on migration FK
          {
            foreignKeyName: "quotes_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
