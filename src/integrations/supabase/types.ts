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
      clients: {
        Row: {
          company_id: string
          contact_email: string | null
          country: string | null
          country_code: string | null
          created_at: string
          currency: string
          flag: string | null
          id: string
          industry: string | null
          is_retainer: boolean
          monthly_revenue: number
          name: string
        }
        Insert: {
          company_id: string
          contact_email?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          currency?: string
          flag?: string | null
          id?: string
          industry?: string | null
          is_retainer?: boolean
          monthly_revenue?: number
          name: string
        }
        Update: {
          company_id?: string
          contact_email?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          currency?: string
          flag?: string | null
          id?: string
          industry?: string | null
          is_retainer?: boolean
          monthly_revenue?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          base_currency: string
          created_at: string
          fiscal_year_start: number
          id: string
          industry: string | null
          name: string
        }
        Insert: {
          base_currency?: string
          created_at?: string
          fiscal_year_start?: number
          id?: string
          industry?: string | null
          name: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          fiscal_year_start?: number
          id?: string
          industry?: string | null
          name?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          actual: number
          budget: number
          category_key: string
          company_id: string
          created_at: string
          id: string
          month: number
          name: string
          year: number
        }
        Insert: {
          actual?: number
          budget?: number
          category_key: string
          company_id: string
          created_at?: string
          id?: string
          month: number
          name: string
          year: number
        }
        Update: {
          actual?: number
          budget?: number
          category_key?: string
          company_id?: string
          created_at?: string
          id?: string
          month?: number
          name?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          client_id: string | null
          company_id: string
          created_at: string
          currency: string
          days_overdue: number
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          status: string
        }
        Insert: {
          amount: number
          client_id?: string | null
          company_id: string
          created_at?: string
          currency?: string
          days_overdue?: number
          due_date: string
          id?: string
          invoice_number: string
          issue_date: string
          notes?: string | null
          status?: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          company_id?: string
          created_at?: string
          currency?: string
          days_overdue?: number
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_records: {
        Row: {
          cash_inflow: number
          cash_outflow: number
          closing_balance: number
          company_id: string
          created_at: string
          expense_breakdown: Json
          expenses: number
          id: string
          month: number
          opening_balance: number
          revenue: number
          revenue_by_currency: Json
          revenue_by_source: Json
          year: number
        }
        Insert: {
          cash_inflow?: number
          cash_outflow?: number
          closing_balance?: number
          company_id: string
          created_at?: string
          expense_breakdown?: Json
          expenses?: number
          id?: string
          month: number
          opening_balance?: number
          revenue?: number
          revenue_by_currency?: Json
          revenue_by_source?: Json
          year: number
        }
        Update: {
          cash_inflow?: number
          cash_outflow?: number
          closing_balance?: number
          company_id?: string
          created_at?: string
          expense_breakdown?: Json
          expenses?: number
          id?: string
          month?: number
          opening_balance?: number
          revenue?: number
          revenue_by_currency?: Json
          revenue_by_source?: Json
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string
          client_id: string | null
          company_id: string
          created_at: string
          currency: string
          date: string
          description: string | null
          id: string
          status: string
          type: string
        }
        Insert: {
          amount: number
          category: string
          client_id?: string | null
          company_id: string
          created_at?: string
          currency?: string
          date: string
          description?: string | null
          id?: string
          status?: string
          type: string
        }
        Update: {
          amount?: number
          category?: string
          client_id?: string | null
          company_id?: string
          created_at?: string
          currency?: string
          date?: string
          description?: string | null
          id?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
