
-- ==========================================
-- BIZTRACK DATABASE SCHEMA
-- ==========================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. BUSINESSES
CREATE TABLE IF NOT EXISTS public.businesses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 2. BUSINESS MEMBERS
CREATE TABLE IF NOT EXISTS public.business_members (
    business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    actor_id text NOT NULL,
    role text NOT NULL CHECK (role IN ('owner', 'staff')),
    PRIMARY KEY (business_id, actor_id)
);

-- 3. PARTIES
CREATE TABLE IF NOT EXISTS public.parties (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    phone text,
    type text NOT NULL CHECK (type IN ('customer', 'supplier', 'both')),
    address text,
    created_at timestamptz DEFAULT now()
);

-- 4. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    sku text UNIQUE,
    category text,
    purchase_price numeric(12,2) NOT NULL DEFAULT 0,
    selling_price numeric(12,2) NOT NULL DEFAULT 0,
    current_stock numeric(12,2) NOT NULL DEFAULT 0,
    min_stock numeric(12,2) NOT NULL DEFAULT 0,
    supplier_id uuid REFERENCES public.parties(id) ON DELETE SET NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 5. TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    type text NOT NULL CHECK (
        type IN (
            'income',
            'expense',
            'customer_credit_sale',
            'customer_payment',
            'supplier_purchase',
            'supplier_payment'
        )
    ),
    party_id uuid REFERENCES public.parties(id) ON DELETE SET NULL,
    amount numeric(12,2) NOT NULL CHECK (amount > 0),
    category text NOT NULL,
    payment_method text CHECK (
        payment_method IN ('cash', 'bank', 'qr', 'online', 'credit')
    ),
    description text,
    due_date date,
    transaction_date date NOT NULL DEFAULT CURRENT_DATE,
    attachment_url text,
    created_at timestamptz DEFAULT now()
);

-- 6. STOCK MOVEMENTS
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
    type text NOT NULL CHECK (
        type IN ('purchase', 'sale', 'damaged', 'lost', 'adjustment')
    ),
    quantity numeric(12,2) NOT NULL CHECK (quantity > 0),
    unit_cost numeric(12,2) DEFAULT 0,
    reason text,
    created_at timestamptz DEFAULT now()
);

-- 7. ADD BUSINESS ID TO EXISTING TABLES
ALTER TABLE public.parties
    ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.stock_movements
    ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- 8. AUDIT LOG
CREATE TABLE IF NOT EXISTS public.audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    action text NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
    actor_id text NOT NULL,
    actor_name text,
    changes jsonb NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- ==========================================
-- DEMO SEED
-- ==========================================

INSERT INTO public.businesses (id, name)
VALUES (
    '11111111-1111-4111-8111-111111111111',
    'BizTrack Demo'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.business_members (business_id, actor_id, role)
VALUES (
    '11111111-1111-4111-8111-111111111111',
    'demo-owner',
    'owner'
)
ON CONFLICT (business_id, actor_id) DO NOTHING;

-- ==========================================
-- ASSIGN EXISTING ROWS TO DEMO BUSINESS
-- ==========================================

UPDATE public.parties
SET business_id = '11111111-1111-4111-8111-111111111111'
WHERE business_id IS NULL;

UPDATE public.products
SET business_id = '11111111-1111-4111-8111-111111111111'
WHERE business_id IS NULL;

UPDATE public.transactions
SET business_id = '11111111-1111-4111-8111-111111111111'
WHERE business_id IS NULL;

UPDATE public.stock_movements
SET business_id = '11111111-1111-4111-8111-111111111111'
WHERE business_id IS NULL;

-- Make business_id mandatory after assignment
ALTER TABLE public.parties
    ALTER COLUMN business_id SET NOT NULL;

ALTER TABLE public.products
    ALTER COLUMN business_id SET NOT NULL;

ALTER TABLE public.transactions
    ALTER COLUMN business_id SET NOT NULL;

ALTER TABLE public.stock_movements
    ALTER COLUMN business_id SET NOT NULL;

-- ==========================================
-- ROW LEVEL SECURITY (DEMO ONLY)
-- ==========================================

DO $$
DECLARE
    tbl text;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'businesses',
        'business_members',
        'parties',
        'products',
        'transactions',
        'stock_movements',
        'audit_log'
    ]
    LOOP
        EXECUTE format(
            'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',
            tbl
        );

        EXECUTE format(
            'DROP POLICY IF EXISTS biztrack_demo_anon_all ON public.%I',
            tbl
        );

        EXECUTE format(
            'CREATE POLICY biztrack_demo_anon_all
             ON public.%I
             FOR ALL TO anon
             USING (true)
             WITH CHECK (true)',
            tbl
        );
    END LOOP;
END $$;

GRANT USAGE ON SCHEMA public TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.businesses,
   public.business_members,
   public.parties,
   public.products,
   public.transactions,
   public.stock_movements,
   public.audit_log
TO anon;

-- Atomically records an inventory movement, updates current stock, and audits it.
CREATE OR REPLACE FUNCTION public.record_stock_movement(
    p_business_id uuid,
    p_product_id uuid,
    p_type text,
    p_quantity numeric,
    p_unit_cost numeric,
    p_reason text,
    p_transaction_id uuid,
    p_adjustment_direction text,
    p_actor_id text,
    p_actor_name text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_product public.products%ROWTYPE;
    v_movement_id uuid;
    v_delta numeric(12,2);
    v_new_stock numeric(12,2);
    v_reason text;
BEGIN
    IF p_type NOT IN ('purchase', 'sale', 'damaged', 'lost', 'adjustment') THEN
        RAISE EXCEPTION 'Invalid stock movement type.';
    END IF;

    IF p_quantity IS NULL OR p_quantity <= 0 OR p_quantity > 9999999999.99 THEN
        RAISE EXCEPTION 'Quantity must be positive and within numeric(12,2) range.';
    END IF;

    IF p_unit_cost IS NULL OR p_unit_cost < 0 OR p_unit_cost > 9999999999.99 THEN
        RAISE EXCEPTION 'Unit cost must be zero or greater and within numeric(12,2) range.';
    END IF;

    IF p_type IN ('damaged', 'lost', 'adjustment') AND NULLIF(BTRIM(p_reason), '') IS NULL THEN
        RAISE EXCEPTION 'A reason is required for this movement.';
    END IF;

    IF p_type = 'adjustment' AND p_adjustment_direction NOT IN ('increase', 'decrease') THEN
        RAISE EXCEPTION 'Adjustment direction must be increase or decrease.';
    END IF;

    SELECT * INTO v_product
    FROM public.products
    WHERE id = p_product_id AND business_id = p_business_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found in this business.' USING ERRCODE = 'P0002';
    END IF;

    IF p_transaction_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.transactions
        WHERE id = p_transaction_id AND business_id = p_business_id
    ) THEN
        RAISE EXCEPTION 'Related transaction not found in this business.';
    END IF;

    v_delta := CASE
        WHEN p_type = 'purchase' THEN p_quantity
        WHEN p_type IN ('sale', 'damaged', 'lost') THEN -p_quantity
        WHEN p_adjustment_direction = 'decrease' THEN -p_quantity
        ELSE p_quantity
    END;
    v_new_stock := v_product.current_stock + v_delta;

    IF v_new_stock < 0 THEN
        RAISE EXCEPTION 'This movement would make stock negative.';
    END IF;

    v_reason := CASE
        WHEN p_type = 'adjustment' THEN
            CASE WHEN p_adjustment_direction = 'decrease' THEN 'Decrease: ' ELSE 'Increase: ' END || BTRIM(p_reason)
        ELSE NULLIF(BTRIM(p_reason), '')
    END;

    INSERT INTO public.stock_movements (
        business_id, product_id, transaction_id, type, quantity, unit_cost, reason
    ) VALUES (
        p_business_id, p_product_id, p_transaction_id, p_type, p_quantity, p_unit_cost, v_reason
    ) RETURNING id INTO v_movement_id;

    UPDATE public.products
    SET current_stock = v_new_stock
    WHERE id = p_product_id AND business_id = p_business_id;

    INSERT INTO public.audit_log (
        business_id, entity_type, entity_id, action, actor_id, actor_name, changes
    ) VALUES (
        p_business_id,
        'product',
        p_product_id,
        'update',
        COALESCE(NULLIF(BTRIM(p_actor_id), ''), 'demo-owner'),
        NULLIF(BTRIM(p_actor_name), ''),
        jsonb_build_object(
            'before', jsonb_build_object('current_stock', v_product.current_stock),
            'after', jsonb_build_object('current_stock', v_new_stock),
            'movement', jsonb_build_object(
                'id', v_movement_id,
                'type', p_type,
                'quantity', p_quantity,
                'reason', v_reason,
                'transaction_id', p_transaction_id
            )
        )
    );

    RETURN v_movement_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_stock_movement(
    uuid, uuid, text, numeric, numeric, text, uuid, text, text, text
) TO anon;
