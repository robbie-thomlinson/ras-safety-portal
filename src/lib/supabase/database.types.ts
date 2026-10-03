
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "job_sites": {
                  Row: {
                    "address": string,"archived_at": string | null,"created_at": string,"id": number,"name": string
                  }
                  Insert: {
                    "address": string,"archived_at"?: string | null,"created_at"?: string,"id"?: never,"name": string
                  }
                  Update: {
                    "address"?: string,"archived_at"?: string | null,"created_at"?: string,"id"?: never,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"first_name": string,"id": string,"last_name": string,"role": Database["public"]['Enums']["user_role"]
                  }
                  Insert: {
                    "created_at"?: string,"first_name": string,"id": string,"last_name": string,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Update: {
                    "created_at"?: string,"first_name"?: string,"id"?: string,"last_name"?: string,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Relationships: [
                    
                  ]
                },"safety_form_photos": {
                  Row: {
                    "content_type": string,"id": number,"path": string,"safety_form_id": number,"size_bytes": number,"uploaded_at": string
                  }
                  Insert: {
                    "content_type": string,"id"?: never,"path": string,"safety_form_id": number,"size_bytes": number,"uploaded_at"?: string
                  }
                  Update: {
                    "content_type"?: string,"id"?: never,"path"?: string,"safety_form_id"?: number,"size_bytes"?: number,"uploaded_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "safety_form_photos_safety_form_id_fkey"
      columns: ["safety_form_id"]
isOneToOne: false
      referencedRelation: "safety_forms"
      referencedColumns: ["id"]
    }
                  ]
                },"safety_forms": {
                  Row: {
                    "boots_worn": boolean,"cords_inspected": boolean,"created_at": string,"date": string,"eye_protection_worn": boolean,"fall_protection_inspected": boolean,"hard_hat_worn": boolean,"hazards_identified": boolean,"id": number,"job_site_id": number,"ladders_inspected": boolean,"notes": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"scaffolding_inspected": boolean,"status": Database["public"]['Enums']["form_status"],"tools_inspected": boolean,"vest_worn": boolean,"worker_id": string
                  }
                  Insert: {
                    "boots_worn": boolean,"cords_inspected": boolean,"created_at"?: string,"date": string,"eye_protection_worn": boolean,"fall_protection_inspected": boolean,"hard_hat_worn": boolean,"hazards_identified": boolean,"id"?: never,"job_site_id": number,"ladders_inspected": boolean,"notes"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"scaffolding_inspected": boolean,"status"?: Database["public"]['Enums']["form_status"],"tools_inspected": boolean,"vest_worn": boolean,"worker_id": string
                  }
                  Update: {
                    "boots_worn"?: boolean,"cords_inspected"?: boolean,"created_at"?: string,"date"?: string,"eye_protection_worn"?: boolean,"fall_protection_inspected"?: boolean,"hard_hat_worn"?: boolean,"hazards_identified"?: boolean,"id"?: never,"job_site_id"?: number,"ladders_inspected"?: boolean,"notes"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"scaffolding_inspected"?: boolean,"status"?: Database["public"]['Enums']["form_status"],"tools_inspected"?: boolean,"vest_worn"?: boolean,"worker_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "safety_forms_job_site_id_fkey"
      columns: ["job_site_id"]
isOneToOne: false
      referencedRelation: "job_sites"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "safety_forms_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "safety_forms_worker_id_fkey"
      columns: ["worker_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"submit_safety_form":
{ Args: { "p_boots_worn": boolean,"p_cords_inspected": boolean,"p_date": string,"p_eye_protection_worn": boolean,"p_fall_protection_inspected": boolean,"p_hard_hat_worn": boolean,"p_hazards_identified": boolean,"p_job_site_id": number,"p_ladders_inspected": boolean,"p_notes": string,"p_photo_paths": (string)[],"p_scaffolding_inspected": boolean,"p_tools_inspected": boolean,"p_vest_worn": boolean }; Returns: number
                           }
          }
          Enums: {
            "form_status": "submitted"|"reviewed","user_role": "farmer"|"admin"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "form_status": ["submitted", "reviewed"],"user_role": ["farmer", "admin"]
          }
        }
} as const
