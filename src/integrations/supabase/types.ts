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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cities: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          label: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          label: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          label?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          content: string
          created_at: string | null
          document_type: string
          id: string
          is_published: boolean
          last_updated: string | null
          title: string
          updated_by: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          document_type: string
          id?: string
          is_published?: boolean
          last_updated?: string | null
          title: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          document_type?: string
          id?: string
          is_published?: boolean
          last_updated?: string | null
          title?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      partnership_applications: {
        Row: {
          business_name: string
          city: string
          contact_person: string
          created_at: string
          email: string
          id: string
          message: string | null
          phone: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          business_name: string
          city: string
          contact_person: string
          created_at?: string
          email: string
          id?: string
          message?: string | null
          phone: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          business_name?: string
          city?: string
          contact_person?: string
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          phone?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          current_lat: number | null
          current_lng: number | null
          email: string | null
          full_name: string
          id: string
          is_available: boolean
          location: string | null
          location_updated_at: string | null
          payout_details: Json | null
          paystack_subaccount_code: string | null
          phone_number: string | null
          updated_at: string | null
          years_experience: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_lat?: number | null
          current_lng?: number | null
          email?: string | null
          full_name: string
          id: string
          is_available?: boolean
          location?: string | null
          location_updated_at?: string | null
          payout_details?: Json | null
          paystack_subaccount_code?: string | null
          phone_number?: string | null
          updated_at?: string | null
          years_experience?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_lat?: number | null
          current_lng?: number | null
          email?: string | null
          full_name?: string
          id?: string
          is_available?: boolean
          location?: string | null
          location_updated_at?: string | null
          payout_details?: Json | null
          paystack_subaccount_code?: string | null
          phone_number?: string | null
          updated_at?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string | null
          customer_id: string
          featured: boolean
          id: string
          provider_id: string
          rating: number
          review: string | null
          service_request_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          featured?: boolean
          id?: string
          provider_id: string
          rating: number
          review?: string | null
          service_request_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          featured?: boolean
          id?: string
          provider_id?: string
          rating?: number
          review?: string | null
          service_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: true
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          amount: number | null
          assigned_at: string | null
          assigned_by: string | null
          completed_at: string | null
          created_at: string | null
          customer_confirmed_at: string | null
          customer_id: string | null
          customer_lat: number | null
          customer_lng: number | null
          description: string | null
          fuel_amount: number | null
          fuel_type: string | null
          id: string
          location: string
          paid_at: string | null
          payment_status: string | null
          paystack_reference: string | null
          phone_number: string | null
          provider_confirmed_payment_at: string | null
          provider_id: string | null
          provider_lat: number | null
          provider_lng: number | null
          quote_approved_at: string | null
          quote_description: string | null
          quoted_amount: number | null
          quoted_at: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["service_status"]
          tracking_code: string | null
          updated_at: string | null
          vehicle_image_url: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_plate: string | null
          vehicle_year: string | null
        }
        Insert: {
          amount?: number | null
          assigned_at?: string | null
          assigned_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          customer_confirmed_at?: string | null
          customer_id?: string | null
          customer_lat?: number | null
          customer_lng?: number | null
          description?: string | null
          fuel_amount?: number | null
          fuel_type?: string | null
          id?: string
          location: string
          paid_at?: string | null
          payment_status?: string | null
          paystack_reference?: string | null
          phone_number?: string | null
          provider_confirmed_payment_at?: string | null
          provider_id?: string | null
          provider_lat?: number | null
          provider_lng?: number | null
          quote_approved_at?: string | null
          quote_description?: string | null
          quoted_amount?: number | null
          quoted_at?: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["service_status"]
          tracking_code?: string | null
          updated_at?: string | null
          vehicle_image_url?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_year?: string | null
        }
        Update: {
          amount?: number | null
          assigned_at?: string | null
          assigned_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          customer_confirmed_at?: string | null
          customer_id?: string | null
          customer_lat?: number | null
          customer_lng?: number | null
          description?: string | null
          fuel_amount?: number | null
          fuel_type?: string | null
          id?: string
          location?: string
          paid_at?: string | null
          payment_status?: string | null
          paystack_reference?: string | null
          phone_number?: string | null
          provider_confirmed_payment_at?: string | null
          provider_id?: string | null
          provider_lat?: number | null
          provider_lng?: number | null
          quote_approved_at?: string | null
          quote_description?: string | null
          quoted_amount?: number | null
          quoted_at?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["service_status"]
          tracking_code?: string | null
          updated_at?: string | null
          vehicle_image_url?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          id: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          paystack_transfer_code: string | null
          paystack_transfer_status: string | null
          platform_amount: number | null
          proof_url: string | null
          provider_amount: number | null
          provider_percentage: number
          reference: string | null
          reference_number: string | null
          service_request_id: string
          status: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          transfer_completed_at: string | null
          transfer_initiated_at: string | null
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          paystack_transfer_code?: string | null
          paystack_transfer_status?: string | null
          platform_amount?: number | null
          proof_url?: string | null
          provider_amount?: number | null
          provider_percentage?: number
          reference?: string | null
          reference_number?: string | null
          service_request_id: string
          status?: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          transfer_completed_at?: string | null
          transfer_initiated_at?: string | null
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          paystack_transfer_code?: string | null
          paystack_transfer_status?: string | null
          platform_amount?: number | null
          proof_url?: string | null
          provider_amount?: number | null
          provider_percentage?: number
          reference?: string | null
          reference_number?: string | null
          service_request_id?: string
          status?: string | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          transfer_completed_at?: string | null
          transfer_initiated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      find_closest_provider: {
        Args: { customer_lat: number; customer_lng: number }
        Returns: {
          distance_km: number
          full_name: string
          provider_id: string
        }[]
      }
      find_nearby_providers: {
        Args: {
          customer_lat: number
          customer_lng: number
          radius_km?: number
          service_type_param?: string
        }
        Returns: {
          avatar_url: string
          avg_rating: number
          current_lat: number
          current_lng: number
          distance_km: number
          full_name: string
          is_available: boolean
          phone_number: string
          provider_id: string
          total_reviews: number
          years_experience: number
        }[]
      }
      generate_tracking_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "customer" | "provider" | "admin" | "super_admin"
      payment_method: "mobile_money"
      service_status:
        | "pending"
        | "assigned"
        | "quoted"
        | "awaiting_payment"
        | "paid"
        | "accepted"
        | "denied"
        | "en_route"
        | "in_progress"
        | "awaiting_confirmation"
        | "completed"
        | "cancelled"
      service_type:
        | "towing"
        | "tire_change"
        | "fuel_delivery"
        | "battery_jump"
        | "lockout_service"
        | "emergency_assistance"
        | "mechanic_fault"
        | "electrical_fault"
      transaction_type: "customer_to_business" | "business_to_provider"
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
      app_role: ["customer", "provider", "admin", "super_admin"],
      payment_method: ["mobile_money"],
      service_status: [
        "pending",
        "assigned",
        "quoted",
        "awaiting_payment",
        "paid",
        "accepted",
        "denied",
        "en_route",
        "in_progress",
        "awaiting_confirmation",
        "completed",
        "cancelled",
      ],
      service_type: [
        "towing",
        "tire_change",
        "fuel_delivery",
        "battery_jump",
        "lockout_service",
        "emergency_assistance",
        "mechanic_fault",
        "electrical_fault",
      ],
      transaction_type: ["customer_to_business", "business_to_provider"],
    },
  },
} as const
