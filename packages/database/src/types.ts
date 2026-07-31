import type {
  DietaryOption,
  DocumentStatus,
  PriceType,
  ProviderDocumentType,
  ProviderStatus,
  ServiceStatus,
  UserRole,
  VerificationStatus,
} from '@buffethub/domain';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Tipagem do schema `public` espelhando `supabase/migrations`. Enquanto não há um
 * banco vivo para rodar `supabase gen types`, este arquivo é a fonte de tipos do
 * banco para o app. Somente as tabelas consumidas pelo frontend têm `Insert`
 * detalhado; as demais usam `Partial<Row>` (leitura tipada é o que importa nelas).
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          birth_date: string | null;
          cpf: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          birth_date?: string | null;
          cpf?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: UserRole;
          granted_by: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role: UserRole;
          granted_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['user_roles']['Insert']>;
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string | null;
          cep: string;
          street: string;
          number: string;
          complement: string | null;
          district: string;
          city: string;
          state: string;
          latitude: number | null;
          longitude: number | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          cep: string;
          street: string;
          number: string;
          district: string;
          city: string;
          state: string;
          label?: string | null;
          complement?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_default?: boolean;
        };
        Update: Partial<Database['public']['Tables']['addresses']['Insert']>;
        Relationships: [];
      };
      providers: {
        Row: {
          id: string;
          owner_id: string;
          legal_name: string;
          trade_name: string;
          slug: string;
          document: string;
          document_type: 'CPF' | 'CNPJ';
          state_registration: string | null;
          business_email: string;
          phone: string;
          whatsapp: string | null;
          website: string | null;
          instagram: string | null;
          description: string;
          founded_year: number | null;
          employee_count: number | null;
          logo_url: string | null;
          banner_url: string | null;
          status: ProviderStatus;
          verification_status: VerificationStatus;
          cep: string | null;
          street: string | null;
          number: string | null;
          complement: string | null;
          district: string | null;
          city: string | null;
          state: string | null;
          latitude: number | null;
          longitude: number | null;
          service_radius_km: number | null;
          min_capacity: number | null;
          max_capacity: number | null;
          price_range_min_cents: number | null;
          price_range_max_cents: number | null;
          cancellation_policy: string | null;
          avg_response_minutes: number | null;
          rating_avg: number;
          rating_count: number;
          bookings_count: number;
          approved_at: string | null;
          rejected_reason: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          owner_id: string;
          legal_name: string;
          trade_name: string;
          slug: string;
          document: string;
          document_type: 'CPF' | 'CNPJ';
          business_email: string;
          phone: string;
          description: string;
          state_registration?: string | null;
          whatsapp?: string | null;
          website?: string | null;
          instagram?: string | null;
          founded_year?: number | null;
          employee_count?: number | null;
          logo_url?: string | null;
          banner_url?: string | null;
          status?: ProviderStatus;
          verification_status?: VerificationStatus;
          cep?: string | null;
          street?: string | null;
          number?: string | null;
          complement?: string | null;
          district?: string | null;
          city?: string | null;
          state?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          service_radius_km?: number | null;
          min_capacity?: number | null;
          max_capacity?: number | null;
          price_range_min_cents?: number | null;
          price_range_max_cents?: number | null;
          cancellation_policy?: string | null;
        };
        Update: Partial<Database['public']['Tables']['providers']['Insert']>;
        Relationships: [];
      };
      provider_members: {
        Row: {
          id: string;
          provider_id: string;
          user_id: string;
          role: UserRole;
          permissions: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          provider_id: string;
          user_id: string;
          role: UserRole;
          permissions?: Json;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['provider_members']['Insert']>;
        Relationships: [];
      };
      provider_documents: {
        Row: {
          id: string;
          provider_id: string;
          type: ProviderDocumentType;
          file_path: string;
          status: DocumentStatus;
          rejected_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['provider_documents']['Row']>;
        Update: Partial<Database['public']['Tables']['provider_documents']['Row']>;
        Relationships: [];
      };
      provider_gallery_images: {
        Row: {
          id: string;
          provider_id: string;
          storage_path: string;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          provider_id: string;
          storage_path: string;
          position?: number;
        };
        Update: Partial<Database['public']['Tables']['provider_gallery_images']['Insert']>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          icon: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['categories']['Row']>;
        Update: Partial<Database['public']['Tables']['categories']['Row']>;
        Relationships: [];
      };
      service_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['service_categories']['Row']>;
        Update: Partial<Database['public']['Tables']['service_categories']['Row']>;
        Relationships: [];
      };
      subcategories: {
        Row: {
          id: string;
          category_id: string;
          slug: string;
          name: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['subcategories']['Row']>;
        Update: Partial<Database['public']['Tables']['subcategories']['Row']>;
        Relationships: [];
      };
      provider_categories: {
        Row: {
          provider_id: string;
          category_id: string;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          provider_id: string;
          category_id: string;
          is_primary?: boolean;
        };
        Update: Partial<Database['public']['Tables']['provider_categories']['Insert']>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          provider_id: string;
          category_id: string;
          name: string;
          slug: string;
          short_description: string | null;
          description: string | null;
          price_type: PriceType;
          base_price_cents: number | null;
          min_quantity: number | null;
          max_quantity: number | null;
          duration_minutes: number | null;
          min_advance_hours: number;
          status: ServiceStatus;
          is_featured: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['services']['Row']>;
        Update: Partial<Database['public']['Tables']['services']['Row']>;
        Relationships: [];
      };
      service_media: {
        Row: {
          id: string;
          service_id: string;
          url: string;
          type: 'IMAGE' | 'VIDEO';
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['service_media']['Row']>;
        Update: Partial<Database['public']['Tables']['service_media']['Row']>;
        Relationships: [];
      };
      service_items: {
        Row: {
          id: string;
          service_id: string;
          name: string;
          is_included: boolean;
          is_optional: boolean;
          extra_price_cents: number;
          sort_order: number;
        };
        Insert: Partial<Database['public']['Tables']['service_items']['Row']>;
        Update: Partial<Database['public']['Tables']['service_items']['Row']>;
        Relationships: [];
      };
      menus: {
        Row: {
          id: string;
          provider_id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['menus']['Row']>;
        Update: Partial<Database['public']['Tables']['menus']['Row']>;
        Relationships: [];
      };
      menu_sections: {
        Row: {
          id: string;
          menu_id: string;
          name: string;
          sort_order: number;
        };
        Insert: Partial<Database['public']['Tables']['menu_sections']['Row']>;
        Update: Partial<Database['public']['Tables']['menu_sections']['Row']>;
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          section_id: string;
          name: string;
          description: string | null;
          dietary: DietaryOption[];
          extra_price_cents: number;
          sort_order: number;
        };
        Insert: Partial<Database['public']['Tables']['menu_items']['Row']>;
        Update: Partial<Database['public']['Tables']['menu_items']['Row']>;
        Relationships: [];
      };
      packages: {
        Row: {
          id: string;
          provider_id: string;
          name: string;
          slug: string;
          description: string | null;
          price_cents: number | null;
          price_per_person_cents: number | null;
          min_guests: number | null;
          max_guests: number | null;
          duration_minutes: number | null;
          menu_id: string | null;
          includes_staff: boolean;
          change_policy: string | null;
          cancellation_policy: string | null;
          status: ServiceStatus;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['packages']['Row']>;
        Update: Partial<Database['public']['Tables']['packages']['Row']>;
        Relationships: [];
      };
      package_items: {
        Row: {
          id: string;
          package_id: string;
          service_id: string | null;
          description: string;
          quantity: number;
          sort_order: number;
        };
        Insert: Partial<Database['public']['Tables']['package_items']['Row']>;
        Update: Partial<Database['public']['Tables']['package_items']['Row']>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      user_role: UserRole;
      provider_status: ProviderStatus;
      verification_status: VerificationStatus;
      service_status: ServiceStatus;
      price_type: PriceType;
      dietary_option: DietaryOption;
      document_status: DocumentStatus;
      provider_document_type: ProviderDocumentType;
    };
    CompositeTypes: { [_ in never]: never };
  };
}

/** Atalhos de tipos por tabela. */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
