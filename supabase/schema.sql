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

-- Apply this function in the Supabase SQL editor. It inserts a movement and
-- updates products.current_stock atomically. Adjustment quantities stay positive
-- in the table (per the quantity > 0 check); p_adjustment_direction decides
-- whether the signed change is an increase or a decrease.
CREATE OR REPLACE FUNCTION public.record_stock_movement(
  p_product_id uuid,
  p_type text,
  p_quantity numeric,
  p_unit_cost numeric DEFAULT 0,
  p_reason text DEFAULT NULL,
  p_transaction_id uuid DEFAULT NULL,
  p_adjustment_direction text DEFAULT 'increase'
)
RETURNS public.stock_movements
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_product public.products%ROWTYPE;
  v_delta numeric;
  v_reason text;
  v_reason_prefix text;
  v_movement public.stock_movements%ROWTYPE;
BEGIN
  IF p_type NOT IN ('purchase', 'sale', 'damaged', 'lost', 'adjustment') THEN
    RAISE EXCEPTION 'Invalid stock movement type: %', p_type;
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be greater than zero';
  END IF;

  IF p_type IN ('damaged', 'lost', 'adjustment')
     AND NULLIF(BTRIM(COALESCE(p_reason, '')), '') IS NULL THEN
    RAISE EXCEPTION 'A reason is required for % movements', p_type;
  END IF;

  IF p_type = 'adjustment'
     AND p_adjustment_direction NOT IN ('increase', 'decrease') THEN
    RAISE EXCEPTION 'Adjustment direction must be increase or decrease';
  END IF;

  SELECT * INTO v_product
  FROM public.products
  WHERE id = p_product_id AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found or archived';
  END IF;

  v_delta := CASE
    WHEN p_type = 'purchase' THEN p_quantity
    WHEN p_type IN ('sale', 'damaged', 'lost') THEN -p_quantity
    WHEN p_type = 'adjustment' AND p_adjustment_direction = 'decrease' THEN -p_quantity
    ELSE p_quantity
  END;

  IF v_product.current_stock + v_delta < 0 THEN
    RAISE EXCEPTION 'Insufficient stock: current %, change %', v_product.current_stock, v_delta;
  END IF;

  v_reason := NULLIF(BTRIM(COALESCE(p_reason, '')), '');
  v_reason_prefix := CASE
    WHEN p_type = 'adjustment' AND p_adjustment_direction = 'decrease' THEN 'Decrease'
    WHEN p_type = 'adjustment' THEN 'Increase'
    ELSE NULL
  END;

  IF v_reason_prefix IS NOT NULL THEN
    v_reason := v_reason_prefix || COALESCE(': ' || v_reason, '');
  END IF;

  INSERT INTO public.stock_movements (
    product_id,
    transaction_id,
    type,
    quantity,
    unit_cost,
    reason
  ) VALUES (
    p_product_id,
    p_transaction_id,
    p_type,
    p_quantity,
    COALESCE(p_unit_cost, 0),
    v_reason
  )
  RETURNING * INTO v_movement;

  UPDATE public.products
  SET current_stock = v_product.current_stock + v_delta
  WHERE id = p_product_id;

  RETURN v_movement;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_stock_movement(
  uuid, text, numeric, numeric, text, uuid, text
) TO anon, authenticated;
