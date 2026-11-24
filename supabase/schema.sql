-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.parties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  type text NOT NULL CHECK (type = ANY (ARRAY['customer'::text, 'supplier'::text, 'both'::text])),
  address text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT parties_pkey PRIMARY KEY (id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text UNIQUE,
  category text,
  purchase_price numeric NOT NULL DEFAULT 0,
  selling_price numeric NOT NULL DEFAULT 0,
  current_stock numeric NOT NULL DEFAULT 0,
  min_stock numeric NOT NULL DEFAULT 0,
  supplier_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.parties(id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type = ANY (ARRAY['income'::text, 'expense'::text, 'customer_credit_sale'::text, 'customer_payment'::text, 'supplier_purchase'::text, 'supplier_payment'::text])),
  party_id uuid,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  category text NOT NULL,
  payment_method text CHECK (payment_method = ANY (ARRAY['cash'::text, 'bank'::text, 'qr'::text, 'online'::text, 'credit'::text])),
  description text,
  due_date date,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  attachment_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_party_id_fkey FOREIGN KEY (party_id) REFERENCES public.parties(id)
);
CREATE TABLE public.stock_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  transaction_id uuid,
  type text NOT NULL CHECK (type = ANY (ARRAY['purchase'::text, 'sale'::text, 'damaged'::text, 'lost'::text, 'adjustment'::text])),
  quantity numeric NOT NULL CHECK (quantity > 0::numeric),
  unit_cost numeric DEFAULT 0,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT stock_movements_pkey PRIMARY KEY (id),
  CONSTRAINT stock_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT stock_movements_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id)
);
