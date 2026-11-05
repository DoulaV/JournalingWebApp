
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
            "ai_reflections": {
                  Row: {
                    "content": string,"created_at": string,"id": string,"updated_at": string,"user_id": string,"week_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "content": string,"created_at"?: string,"id"?: string,"updated_at"?: string,"user_id"?: string,"week_start": string
                  }
                  Update: {
                    "content"?: string,"created_at"?: string,"id"?: string,"updated_at"?: string,"user_id"?: string,"week_start"?: string
                  }
                  Relationships: [
                    
                  ]
                },"attachments": {
                  Row: {
                    "created_at": string,"duration_seconds": number | null,"entry_id": string,"id": string,"kind": string,"mime_type": string | null,"size_bytes": number | null,"storage_path": string,"transcript": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"duration_seconds"?: number | null,"entry_id": string,"id"?: string,"kind": string,"mime_type"?: string | null,"size_bytes"?: number | null,"storage_path": string,"transcript"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"duration_seconds"?: number | null,"entry_id"?: string,"id"?: string,"kind"?: string,"mime_type"?: string | null,"size_bytes"?: number | null,"storage_path"?: string,"transcript"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "attachments_entry_id_fkey"
      columns: ["entry_id"]
isOneToOne: false
      referencedRelation: "entries"
      referencedColumns: ["id"]
    }
                  ]
                },"entries": {
                  Row: {
                    "body": Json | null,"body_text": string,"created_at": string,"entry_date": string,"id": string,"is_backfilled": boolean,"mood_valence": number | null,"prompt_id": string | null,"ritual": string,"search": unknown,"title": string,"updated_at": string,"user_id": string,"word_count": number
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: Json | null,"body_text"?: string,"created_at"?: string,"entry_date": string,"id"?: string,"is_backfilled"?: boolean,"mood_valence"?: number | null,"prompt_id"?: string | null,"ritual"?: string,"search"?: never,"title"?: string,"updated_at"?: string,"user_id"?: string,"word_count"?: number
                  }
                  Update: {
                    "body"?: Json | null,"body_text"?: string,"created_at"?: string,"entry_date"?: string,"id"?: string,"is_backfilled"?: boolean,"mood_valence"?: number | null,"prompt_id"?: string | null,"ritual"?: string,"search"?: never,"title"?: string,"updated_at"?: string,"user_id"?: string,"word_count"?: number
                  }
                  Relationships: [
                    
                  ]
                },"entry_emotions": {
                  Row: {
                    "body_location": string | null,"core": string,"created_at": string,"entry_id": string,"id": string,"intensity": number,"middle": string | null,"position": number,"precise": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body_location"?: string | null,"core": string,"created_at"?: string,"entry_id": string,"id"?: string,"intensity"?: number,"middle"?: string | null,"position"?: number,"precise"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "body_location"?: string | null,"core"?: string,"created_at"?: string,"entry_id"?: string,"id"?: string,"intensity"?: number,"middle"?: string | null,"position"?: number,"precise"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "entry_emotions_entry_id_fkey"
      columns: ["entry_id"]
isOneToOne: false
      referencedRelation: "entries"
      referencedColumns: ["id"]
    }
                  ]
                },"entry_tags": {
                  Row: {
                    "created_at": string,"entry_id": string,"id": string,"tag_id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"entry_id": string,"id"?: string,"tag_id": string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"entry_id"?: string,"id"?: string,"tag_id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "entry_tags_entry_id_fkey"
      columns: ["entry_id"]
isOneToOne: false
      referencedRelation: "entries"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "entry_tags_tag_id_fkey"
      columns: ["tag_id"]
isOneToOne: false
      referencedRelation: "tags"
      referencedColumns: ["id"]
    }
                  ]
                },"future_letters": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"notified_at": string | null,"opened_at": string | null,"sealed_until": string,"title": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"id"?: string,"notified_at"?: string | null,"opened_at"?: string | null,"sealed_until": string,"title"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"notified_at"?: string | null,"opened_at"?: string | null,"sealed_until"?: string,"title"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "ai_reflection_enabled": boolean,"body_check_enabled": boolean,"created_at": string,"display_name": string | null,"emotion_depth_unlocked": number,"font_size": number,"id": string,"language": string,"lock_timeout_minutes": number,"morning_reminder_enabled": boolean,"morning_reminder_time": string,"notifications_sent_count": number,"notifications_sent_kinds": string | null,"notifications_sent_on": string | null,"nudge_enabled": boolean,"nudge_time": string,"palette": string,"pin_hash": string | null,"reminder_anchor": string,"reminder_time": string,"reminders_enabled": boolean,"show_prompts": boolean,"show_streak": boolean,"theme": string,"timezone": string,"transcription_enabled": boolean,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ai_reflection_enabled"?: boolean,"body_check_enabled"?: boolean,"created_at"?: string,"display_name"?: string | null,"emotion_depth_unlocked"?: number,"font_size"?: number,"id"?: string,"language"?: string,"lock_timeout_minutes"?: number,"morning_reminder_enabled"?: boolean,"morning_reminder_time"?: string,"notifications_sent_count"?: number,"notifications_sent_kinds"?: string | null,"notifications_sent_on"?: string | null,"nudge_enabled"?: boolean,"nudge_time"?: string,"palette"?: string,"pin_hash"?: string | null,"reminder_anchor"?: string,"reminder_time"?: string,"reminders_enabled"?: boolean,"show_prompts"?: boolean,"show_streak"?: boolean,"theme"?: string,"timezone"?: string,"transcription_enabled"?: boolean,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "ai_reflection_enabled"?: boolean,"body_check_enabled"?: boolean,"created_at"?: string,"display_name"?: string | null,"emotion_depth_unlocked"?: number,"font_size"?: number,"id"?: string,"language"?: string,"lock_timeout_minutes"?: number,"morning_reminder_enabled"?: boolean,"morning_reminder_time"?: string,"notifications_sent_count"?: number,"notifications_sent_kinds"?: string | null,"notifications_sent_on"?: string | null,"nudge_enabled"?: boolean,"nudge_time"?: string,"palette"?: string,"pin_hash"?: string | null,"reminder_anchor"?: string,"reminder_time"?: string,"reminders_enabled"?: boolean,"show_prompts"?: boolean,"show_streak"?: boolean,"theme"?: string,"timezone"?: string,"transcription_enabled"?: boolean,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"prompt_history": {
                  Row: {
                    "created_at": string,"id": string,"prompt_id": string,"shown_on": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"prompt_id": string,"shown_on": string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"prompt_id"?: string,"shown_on"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"push_subscriptions": {
                  Row: {
                    "created_at": string,"device_label": string,"endpoint": string,"id": string,"keys": NonNullable<Json>,"last_used_at": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"device_label"?: string,"endpoint": string,"id"?: string,"keys": NonNullable<Json>,"last_used_at"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"device_label"?: string,"endpoint"?: string,"id"?: string,"keys"?: NonNullable<Json>,"last_used_at"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"streak_events": {
                  Row: {
                    "created_at": string,"date": string,"id": string,"seen": boolean,"type": string,"updated_at": string,"user_id": string,"value": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"date": string,"id"?: string,"seen"?: boolean,"type": string,"updated_at"?: string,"user_id": string,"value"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"date"?: string,"id"?: string,"seen"?: boolean,"type"?: string,"updated_at"?: string,"user_id"?: string,"value"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"streaks": {
                  Row: {
                    "at_risk": boolean,"created_at": string,"current_length": number,"freezes_available": number,"id": string,"last_counted_date": string | null,"longest_length": number,"total_days_written": number,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "at_risk"?: boolean,"created_at"?: string,"current_length"?: number,"freezes_available"?: number,"id"?: string,"last_counted_date"?: string | null,"longest_length"?: number,"total_days_written"?: number,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "at_risk"?: boolean,"created_at"?: string,"current_length"?: number,"freezes_available"?: number,"id"?: string,"last_counted_date"?: string | null,"longest_length"?: number,"total_days_written"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"tags": {
                  Row: {
                    "created_at": string,"id": string,"is_default": boolean,"name": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_default"?: boolean,"name": string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_default"?: boolean,"name"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "letters_overview":
{ Args: Record<PropertyKey, never>; Returns: {
              "created_at": string,"id": string,"is_open": boolean,"opened_at": string,"sealed_until": string,"title": string
            }[]
                           },
"search_entries":
{ Args: { "p_core"?: string,"p_from"?: string,"p_has_audio"?: boolean,"p_has_photo"?: boolean,"p_limit"?: number,"p_query"?: string,"p_tag"?: string,"p_to"?: string }; Returns: {
              "body": Json | null,
"body_text": string,
"created_at": string,
"entry_date": string,
"id": string,
"is_backfilled": boolean,
"mood_valence": number | null,
"prompt_id": string | null,
"ritual": string,
"search": unknown,
"title": string,
"updated_at": string,
"user_id": string,
"word_count": number
            }[]
                          SetofOptions: {
        from: "*"
        to: "entries"
        isOneToOne: false
        isSetofReturn: true
      } },
"sync_allowed_email":
{ Args: { "p_email": string }; Returns: undefined
                           },
"user_today":
{ Args: { "p_user"?: string }; Returns: string
                           }
          }
          Enums: {
            [_ in never]: never
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
            
          }
        }
} as const
