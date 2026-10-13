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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line: string
          commune_id: number | null
          commune_name: string | null
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          phone: string
          user_id: string | null
          wilaya_id: number | null
        }
        Insert: {
          address_line: string
          commune_id?: number | null
          commune_name?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          phone: string
          user_id?: string | null
          wilaya_id?: number | null
        }
        Update: {
          address_line?: string
          commune_id?: number | null
          commune_name?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          phone?: string
          user_id?: string | null
          wilaya_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_commune_id_fkey"
            columns: ["commune_id"]
            isOneToOne: false
            referencedRelation: "communes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string | null
          created_at: string
          id: string
          product_variant_id: string | null
          quantity: number
          vendor_id: string | null
        }
        Insert: {
          cart_id?: string | null
          created_at?: string
          id?: string
          product_variant_id?: string | null
          quantity?: number
          vendor_id?: string | null
        }
        Update: {
          cart_id?: string | null
          created_at?: string
          id?: string
          product_variant_id?: string | null
          quantity?: number
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          id: string
          image_url: string | null
          name_en: string
          name_fr: string
          parent_id: string | null
          position: number
          slug: string
        }
        Insert: {
          id?: string
          image_url?: string | null
          name_en: string
          name_fr: string
          parent_id?: string | null
          position?: number
          slug: string
        }
        Update: {
          id?: string
          image_url?: string | null
          name_en?: string
          name_fr?: string
          parent_id?: string | null
          position?: number
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      colors: {
        Row: {
          created_at: string
          hex_code: string
          id: string
          is_active: boolean
          name: string
          name_fr: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          hex_code: string
          id?: string
          is_active?: boolean
          name: string
          name_fr?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          hex_code?: string
          id?: string
          is_active?: boolean
          name?: string
          name_fr?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      communes: {
        Row: {
          id: number
          name_en: string
          name_fr: string
          wilaya_id: number | null
        }
        Insert: {
          id: number
          name_en: string
          name_fr: string
          wilaya_id?: number | null
        }
        Update: {
          id?: number
          name_en?: string
          name_fr?: string
          wilaya_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "communes_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      measurements: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          name_fr: string | null
          sort_order: number
          unit: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          name_fr?: string | null
          sort_order?: number
          unit: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          name_fr?: string | null
          sort_order?: number
          unit?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          product_variant_id: string | null
          quantity: number
          stock_restored: boolean
          subtotal: number
          unit_price: number
          vendor_order_id: string | null
        }
        Insert: {
          id?: string
          product_variant_id?: string | null
          quantity: number
          stock_restored?: boolean
          subtotal: number
          unit_price: number
          vendor_order_id?: string | null
        }
        Update: {
          id?: string
          product_variant_id?: string | null
          quantity?: number
          stock_restored?: boolean
          subtotal?: number
          unit_price?: number
          vendor_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_vendor_order_id_fkey"
            columns: ["vendor_order_id"]
            isOneToOne: false
            referencedRelation: "vendor_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          auth0_sub: string | null
          collected: boolean
          created_at: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          ref: string | null
          shipping_address_id: string | null
          shipping_fee: number
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          user_id: string | null
        }
        Insert: {
          auth0_sub?: string | null
          collected?: boolean
          created_at?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          ref?: string | null
          shipping_address_id?: string | null
          shipping_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          user_id?: string | null
        }
        Update: {
          auth0_sub?: string | null
          collected?: boolean
          created_at?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          ref?: string | null
          shipping_address_id?: string | null
          shipping_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_shipping_address_id_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string | null
          paid_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          transaction_ref: string | null
        }
        Insert: {
          amount: number
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          order_id?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_ref?: string | null
        }
        Update: {
          amount?: number
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          order_id?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_colors: {
        Row: {
          color_id: string
          product_id: string
        }
        Insert: {
          color_id: string
          product_id: string
        }
        Update: {
          color_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_colors_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_colors_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          blur_placeholder: string | null
          height: number | null
          id: string
          position: number
          product_id: string | null
          url: string
          variant_id: string | null
          width: number | null
        }
        Insert: {
          blur_placeholder?: string | null
          height?: number | null
          id?: string
          position?: number
          product_id?: string | null
          url: string
          variant_id?: string | null
          width?: number | null
        }
        Update: {
          blur_placeholder?: string | null
          height?: number | null
          id?: string
          position?: number
          product_id?: string | null
          url?: string
          variant_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_measurements: {
        Row: {
          measurement_id: string
          product_id: string
        }
        Insert: {
          measurement_id: string
          product_id: string
        }
        Update: {
          measurement_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_measurements_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "measurements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_measurements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color: string | null
          created_at: string
          id: string
          price_override: number | null
          product_id: string | null
          size: string | null
          sku: string | null
          stock_quantity: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          price_override?: number | null
          product_id?: string | null
          size?: string | null
          sku?: string | null
          stock_quantity?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          price_override?: number | null
          product_id?: string | null
          size?: string | null
          sku?: string | null
          stock_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          brand: string | null
          category_id: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          name: string
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          vendor_id: string | null
        }
        Insert: {
          base_price: number
          brand?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          vendor_id?: string | null
        }
        Update: {
          base_price?: number
          brand?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          product_id: string | null
          rating: number
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          rating: number
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          rating?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_orders: {
        Row: {
          commission_amount: number
          created_at: string
          id: string
          order_id: string | null
          status: Database["public"]["Enums"]["vendor_order_status"]
          subtotal: number
          tracking_number: string | null
          vendor_id: string | null
        }
        Insert: {
          commission_amount?: number
          created_at?: string
          id?: string
          order_id?: string | null
          status?: Database["public"]["Enums"]["vendor_order_status"]
          subtotal?: number
          tracking_number?: string | null
          vendor_id?: string | null
        }
        Update: {
          commission_amount?: number
          created_at?: string
          id?: string
          order_id?: string | null
          status?: Database["public"]["Enums"]["vendor_order_status"]
          subtotal?: number
          tracking_number?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_payouts: {
        Row: {
          amount: number
          id: string
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          status: Database["public"]["Enums"]["payout_status"]
          vendor_id: string | null
        }
        Insert: {
          amount: number
          id?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          id?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payouts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          banner_url: string | null
          commission_rate: number
          commune_id: number | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string | null
          slug: string
          status: Database["public"]["Enums"]["vendor_status"]
          wilaya_id: number | null
        }
        Insert: {
          banner_url?: string | null
          commission_rate?: number
          commune_id?: number | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["vendor_status"]
          wilaya_id?: number | null
        }
        Update: {
          banner_url?: string | null
          commission_rate?: number
          commune_id?: number | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["vendor_status"]
          wilaya_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_commune_id_fkey"
            columns: ["commune_id"]
            isOneToOne: false
            referencedRelation: "communes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      wilayas: {
        Row: {
          code: number
          id: number
          name_en: string
          name_fr: string
        }
        Insert: {
          code: number
          id: number
          name_en: string
          name_fr: string
        }
        Update: {
          code?: number
          id?: number
          name_en?: string
          name_fr?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      catalog_categories: { Args: never; Returns: Json[] }
      catalog_options: { Args: never; Returns: Json }
      catalog_product: { Args: { p_slug: string }; Returns: Json }
      catalog_products: {
        Args: {
          p_category?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
        }
        Returns: Json[]
      }
      delivery_fee_for: { Args: { p_subtotal: number }; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      order_advance: { Args: { p_order_id: string }; Returns: undefined }
      order_cancel: { Args: { p_order_id: string }; Returns: undefined }
      order_display_status: { Args: { p_order_id: string }; Returns: string }
      order_list_all: { Args: never; Returns: Json[] }
      order_list_by_sub: { Args: { p_sub: string }; Returns: Json[] }
      order_list_own: { Args: never; Returns: Json[] }
      order_place: {
        Args: {
          p_address: string
          p_auth0_sub?: string
          p_commune: string
          p_items: Json
          p_name: string
          p_payment_method: string
          p_phone: string
          p_shipping_fee: number
          p_wilaya: number
        }
        Returns: Json
      }
      order_set_collected: {
        Args: { p_collected: boolean; p_order_id: string }
        Returns: undefined
      }
      serialize_order: { Args: { p_order_id: string }; Returns: Json }
      vendor_analytics: {
        Args: { p_days?: number; p_owner: string; p_vendor_id: string }
        Returns: Json
      }
      vendor_apply: {
        Args: {
          p_commune_id?: number
          p_description?: string
          p_name: string
          p_owner: string
          p_slug: string
          p_wilaya_id?: number
        }
        Returns: Json
      }
      vendor_list_own: { Args: { p_owner: string }; Returns: Json[] }
      vendor_orders_list: {
        Args: { p_owner: string; p_vendor_id: string }
        Returns: Json[]
      }
      vendor_owned: {
        Args: { p_owner: string; p_vendor_id: string }
        Returns: boolean
      }
      vendor_payouts_list: {
        Args: { p_owner: string; p_vendor_id: string }
        Returns: Json[]
      }
      vendor_product_archive: {
        Args: { p_owner: string; p_product_id: string }
        Returns: Json
      }
      vendor_product_delete: {
        Args: { p_owner: string; p_product_id: string }
        Returns: boolean
      }
      vendor_product_image_update_meta: {
        Args: {
          p_blurhash?: string
          p_height?: number
          p_image_url: string
          p_owner: string
          p_product_id: string
          p_vendor_id: string
          p_width?: number
        }
        Returns: boolean
      }
      vendor_product_upsert:
        | {
            Args: {
              p_base_price?: number
              p_brand?: string
              p_category_id?: string
              p_color?: string
              p_description?: string
              p_image_url?: string
              p_name?: string
              p_owner: string
              p_product_id?: string
              p_sizes?: string[]
              p_slug?: string
              p_status?: string
              p_vendor_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_base_price?: number
              p_brand?: string
              p_category_id?: string
              p_color?: string
              p_color_ids?: string[]
              p_description?: string
              p_image_url?: string
              p_measurement_ids?: string[]
              p_name?: string
              p_owner: string
              p_product_id?: string
              p_sizes?: string[]
              p_slug?: string
              p_status?: string
              p_vendor_id: string
            }
            Returns: Json
          }
      vendor_products_list: {
        Args: { p_owner: string; p_vendor_id: string }
        Returns: Json[]
      }
      vendor_public_get: { Args: { p_slug: string }; Returns: Json }
      vendor_stock_set: {
        Args: { p_owner: string; p_stock: number; p_variant_id: string }
        Returns: Json
      }
      vendor_variant_delete: {
        Args: { p_owner: string; p_variant_id: string }
        Returns: boolean
      }
      vendor_variant_upsert: {
        Args: {
          p_color?: string
          p_owner: string
          p_price_override?: number
          p_product_id: string
          p_size?: string
          p_sku?: string
          p_stock_quantity?: number
          p_variant_id?: string
        }
        Returns: Json
      }
    }
    Enums: {
      order_status: "pending" | "confirmed" | "completed" | "cancelled"
      payment_method: "cod" | "edahabia" | "cib" | "satim"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      payout_status: "pending" | "paid"
      product_status: "draft" | "active" | "archived"
      user_role: "customer" | "vendor" | "admin"
      vendor_order_status:
        | "pending"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      vendor_status: "pending" | "active" | "suspended"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      order_status: ["pending", "confirmed", "completed", "cancelled"],
      payment_method: ["cod", "edahabia", "cib", "satim"],
      payment_status: ["pending", "paid", "failed", "refunded"],
      payout_status: ["pending", "paid"],
      product_status: ["draft", "active", "archived"],
      user_role: ["customer", "vendor", "admin"],
      vendor_order_status: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      vendor_status: ["pending", "active", "suspended"],
    },
  },
} as const
