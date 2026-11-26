
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

-- 6. SUPPLIER ORDERS
CREATE TABLE IF NOT EXISTS public.supplier_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    supplier_id uuid NOT NULL REFERENCES public.parties(id) ON DELETE RESTRICT,
    product_id uuid REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity numeric(12,2) CHECK (quantity IS NULL OR quantity > 0),
    items text NOT NULL CHECK (BTRIM(items) <> ''),
    category text NOT NULL CHECK (BTRIM(category) <> ''),
    total_amount numeric(12,2) NOT NULL CHECK (total_amount > 0),
    order_date date NOT NULL,
    due_date date NOT NULL,
    status text NOT NULL DEFAULT 'ordered' CHECK (status IN ('ordered', 'received')),
    attachment_url text,
    received_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (due_date >= order_date),
    CONSTRAINT supplier_orders_product_quantity_pair_check
        CHECK ((product_id IS NULL) = (quantity IS NULL))
);

ALTER TABLE public.supplier_orders
    ADD COLUMN IF NOT EXISTS product_id uuid
    REFERENCES public.products(id) ON DELETE RESTRICT;

ALTER TABLE public.supplier_orders
    ADD COLUMN IF NOT EXISTS quantity numeric(12,2)
    CHECK (quantity IS NULL OR quantity > 0);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'supplier_orders_product_quantity_pair_check'
          AND conrelid = 'public.supplier_orders'::regclass
    ) THEN
        ALTER TABLE public.supplier_orders
            ADD CONSTRAINT supplier_orders_product_quantity_pair_check
            CHECK ((product_id IS NULL) = (quantity IS NULL));
    END IF;
END;
$$;

ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS supplier_order_id uuid
    REFERENCES public.supplier_orders(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.supplier_order_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    order_id uuid NOT NULL REFERENCES public.supplier_orders(id) ON DELETE RESTRICT,
    supplier_id uuid NOT NULL REFERENCES public.parties(id) ON DELETE RESTRICT,
    amount numeric(12,2) NOT NULL CHECK (amount > 0),
    payment_method text NOT NULL CHECK (
        payment_method IN ('cash', 'bank', 'qr', 'online')
    ),
    payment_date date NOT NULL,
    transaction_id uuid NOT NULL UNIQUE
        REFERENCES public.transactions(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS supplier_orders_business_supplier_date_idx
    ON public.supplier_orders (business_id, supplier_id, order_date, created_at);

CREATE INDEX IF NOT EXISTS supplier_order_payments_business_order_idx
    ON public.supplier_order_payments (business_id, order_id, payment_date, created_at);

CREATE INDEX IF NOT EXISTS transactions_supplier_order_id_idx
    ON public.transactions (supplier_order_id)
    WHERE supplier_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_supplier_order_purchase_unique
    ON public.transactions (supplier_order_id)
    WHERE supplier_order_id IS NOT NULL AND type = 'supplier_purchase';

-- 7. STOCK MOVEMENTS
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

CREATE UNIQUE INDEX IF NOT EXISTS products_business_name_ci_unique
    ON public.products (business_id, lower(BTRIM(name)));

CREATE UNIQUE INDEX IF NOT EXISTS parties_business_name_phone_unique
    ON public.parties (
        business_id,
        lower(BTRIM(name)),
        regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g')
    )
    WHERE regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') <> '';

CREATE OR REPLACE FUNCTION public.prevent_party_delete_with_open_credit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_customer_balance numeric;
    v_supplier_balance numeric;
BEGIN
    IF OLD.type IN ('customer', 'both') THEN
        SELECT GREATEST(COALESCE(SUM(
            CASE
                WHEN type = 'customer_credit_sale' THEN amount
                WHEN type = 'customer_payment' THEN -amount
                ELSE 0
            END
        ), 0), 0)
        INTO v_customer_balance
        FROM public.transactions
        WHERE business_id = OLD.business_id
          AND party_id = OLD.id
          AND type IN ('customer_credit_sale', 'customer_payment');

        IF v_customer_balance > 0 THEN
            RAISE EXCEPTION
                'Cannot delete customer with outstanding credit of Rs. %.',
                TO_CHAR(v_customer_balance, 'FM999999999999990.00');
        END IF;
    END IF;

    IF OLD.type IN ('supplier', 'both') THEN
        SELECT GREATEST(COALESCE(SUM(
            CASE
                WHEN type = 'supplier_purchase' AND payment_method = 'credit'
                    THEN amount
                WHEN type = 'supplier_payment' THEN -amount
                ELSE 0
            END
        ), 0), 0)
        INTO v_supplier_balance
        FROM public.transactions
        WHERE business_id = OLD.business_id
          AND party_id = OLD.id
          AND type IN ('supplier_purchase', 'supplier_payment');

        IF v_supplier_balance > 0 THEN
            RAISE EXCEPTION
                'Cannot delete supplier with outstanding payable of Rs. %.',
                TO_CHAR(v_supplier_balance, 'FM999999999999990.00');
        END IF;
    END IF;

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS prevent_party_delete_with_open_credit
    ON public.parties;
CREATE TRIGGER prevent_party_delete_with_open_credit
    BEFORE DELETE ON public.parties
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_party_delete_with_open_credit();

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
        'supplier_orders',
        'supplier_order_payments',
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
   public.supplier_orders,
   public.supplier_order_payments,
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

    IF p_type = 'purchase' AND (
        p_transaction_id IS NULL OR NOT EXISTS (
            SELECT 1 FROM public.transactions
            WHERE id = p_transaction_id
              AND business_id = p_business_id
              AND type = 'supplier_purchase'
        )
    ) THEN
        RAISE EXCEPTION 'Inventory purchases must include a supplier purchase transaction.';
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

-- Atomically records a paid or supplier-credit restock and its stock movement.
CREATE OR REPLACE FUNCTION public.record_product_restock(
    p_business_id uuid,
    p_product_id uuid,
    p_supplier_id uuid,
    p_quantity numeric,
    p_unit_cost numeric,
    p_paid_amount numeric,
    p_payment_method text,
    p_transaction_date date,
    p_due_date date,
    p_description text,
    p_actor_id text,
    p_actor_name text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_product public.products%ROWTYPE;
    v_supplier public.parties%ROWTYPE;
    v_total numeric;
    v_payable numeric;
    v_purchase_id uuid;
    v_payment_id uuid;
    v_reason text;
BEGIN
    IF p_quantity IS NULL OR p_quantity <= 0 OR p_quantity > 9999999999.99
       OR p_quantity <> ROUND(p_quantity, 2) THEN
        RAISE EXCEPTION 'Quantity must be positive with at most 2 decimal places.';
    END IF;

    IF p_unit_cost IS NULL OR p_unit_cost <= 0 OR p_unit_cost > 9999999999.99
       OR p_unit_cost <> ROUND(p_unit_cost, 2) THEN
        RAISE EXCEPTION 'Unit cost must be positive with at most 2 decimal places.';
    END IF;

    IF p_paid_amount IS NULL OR p_paid_amount < 0 OR p_paid_amount > 9999999999.99
       OR p_paid_amount <> ROUND(p_paid_amount, 2) THEN
        RAISE EXCEPTION 'Paid amount must be zero or greater with at most 2 decimal places.';
    END IF;

    IF p_payment_method IS NULL
       OR p_payment_method NOT IN ('cash', 'bank', 'qr', 'online') THEN
        RAISE EXCEPTION 'Choose a valid payment method.';
    END IF;

    IF p_transaction_date IS NULL
       OR p_transaction_date > (now() AT TIME ZONE 'Asia/Kathmandu')::date THEN
        RAISE EXCEPTION 'Transaction date cannot be in the future.';
    END IF;

    SELECT * INTO v_product
    FROM public.products
    WHERE id = p_product_id
      AND business_id = p_business_id
      AND is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Active product not found in this business.' USING ERRCODE = 'P0002';
    END IF;

    v_total := ROUND(p_quantity * p_unit_cost, 2);
    IF v_total <= 0 OR v_total > 9999999999.99 THEN
        RAISE EXCEPTION 'Restock total must be positive and within the supported amount range.';
    END IF;
    IF p_paid_amount > v_total THEN
        RAISE EXCEPTION 'Paid amount cannot exceed the restock total.';
    END IF;

    v_payable := v_total - p_paid_amount;
    IF v_payable > 0 AND p_supplier_id IS NULL THEN
        RAISE EXCEPTION 'A supplier is required for an unpaid restock balance.';
    END IF;
    IF p_supplier_id IS NOT NULL THEN
        SELECT * INTO v_supplier
        FROM public.parties
        WHERE id = p_supplier_id
          AND business_id = p_business_id
          AND type IN ('supplier', 'both');

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Supplier not found in this business.' USING ERRCODE = 'P0002';
        END IF;
    END IF;

    IF v_payable > 0 AND (
        p_due_date IS NULL OR p_due_date < p_transaction_date
    ) THEN
        RAISE EXCEPTION 'A due date on or after the purchase date is required for the unpaid balance.';
    END IF;

    INSERT INTO public.transactions (
        business_id, type, party_id, amount, category, payment_method,
        description, due_date, transaction_date
    ) VALUES (
        p_business_id,
        'supplier_purchase',
        p_supplier_id,
        v_total,
        'Inventory restock',
        CASE WHEN v_payable > 0 THEN 'credit' ELSE p_payment_method END,
        COALESCE(NULLIF(BTRIM(p_description), ''), 'Restock: ' || v_product.name),
        CASE WHEN v_payable > 0 THEN p_due_date ELSE NULL END,
        p_transaction_date
    ) RETURNING id INTO v_purchase_id;

    IF p_paid_amount > 0 AND v_payable > 0 THEN
        INSERT INTO public.transactions (
            business_id, type, party_id, amount, category, payment_method,
            description, transaction_date
        ) VALUES (
            p_business_id,
            'supplier_payment',
            p_supplier_id,
            p_paid_amount,
            'Inventory restock payment',
            p_payment_method,
            'Partial payment for ' || v_product.name,
            p_transaction_date
        ) RETURNING id INTO v_payment_id;

        INSERT INTO public.audit_log (
            business_id, entity_type, entity_id, action, actor_id, actor_name, changes
        ) VALUES (
            p_business_id, 'transaction', v_payment_id, 'insert',
            COALESCE(NULLIF(BTRIM(p_actor_id), ''), 'demo-owner'),
            NULLIF(BTRIM(p_actor_name), ''),
            jsonb_build_object('before', NULL, 'after', jsonb_build_object(
                'id', v_payment_id, 'type', 'supplier_payment',
                'party_id', p_supplier_id, 'amount', p_paid_amount
            ))
        );
    END IF;

    v_reason := CASE
        WHEN p_supplier_id IS NULL THEN 'Restock'
        ELSE 'Restock from ' || v_supplier.name
    END;
    PERFORM public.record_stock_movement(
        p_business_id,
        p_product_id,
        'purchase',
        p_quantity,
        p_unit_cost,
        v_reason,
        v_purchase_id,
        'increase',
        p_actor_id,
        p_actor_name
    );

    INSERT INTO public.audit_log (
        business_id, entity_type, entity_id, action, actor_id, actor_name, changes
    ) VALUES (
        p_business_id, 'transaction', v_purchase_id, 'insert',
        COALESCE(NULLIF(BTRIM(p_actor_id), ''), 'demo-owner'),
        NULLIF(BTRIM(p_actor_name), ''),
        jsonb_build_object('before', NULL, 'after', jsonb_build_object(
            'id', v_purchase_id, 'type', 'supplier_purchase',
            'party_id', p_supplier_id, 'amount', v_total,
            'payment_method', CASE WHEN v_payable > 0 THEN 'credit' ELSE p_payment_method END,
            'paid_amount', p_paid_amount, 'due_date', p_due_date
        ))
    );

    RETURN v_purchase_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_product_restock(
    uuid, uuid, uuid, numeric, numeric, numeric, text, date, date, text, text, text
) TO anon;

-- Atomically records a paid or credit product sale and decreases stock.
CREATE OR REPLACE FUNCTION public.record_product_sale(
    p_business_id uuid,
    p_product_id uuid,
    p_quantity numeric,
    p_customer_id uuid,
    p_payment_method text,
    p_transaction_date date,
    p_due_date date,
    p_description text,
    p_actor_id text,
    p_actor_name text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_product public.products%ROWTYPE;
    v_customer public.parties%ROWTYPE;
    v_total numeric;
    v_transaction_id uuid;
    v_type text;
BEGIN
    IF p_quantity IS NULL OR p_quantity <= 0 OR p_quantity > 9999999999.99
       OR p_quantity <> ROUND(p_quantity, 2) THEN
        RAISE EXCEPTION 'Quantity must be positive with at most 2 decimal places.';
    END IF;

    IF p_payment_method IS NULL
       OR p_payment_method NOT IN ('cash', 'bank', 'qr', 'online', 'credit') THEN
        RAISE EXCEPTION 'Choose a valid payment method.';
    END IF;

    IF p_transaction_date IS NULL
       OR p_transaction_date > (now() AT TIME ZONE 'Asia/Kathmandu')::date THEN
        RAISE EXCEPTION 'Transaction date cannot be in the future.';
    END IF;

    SELECT * INTO v_product
    FROM public.products
    WHERE id = p_product_id
      AND business_id = p_business_id
      AND is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Active product not found in this business.' USING ERRCODE = 'P0002';
    END IF;

    IF p_quantity > v_product.current_stock THEN
        RAISE EXCEPTION 'Sale quantity exceeds available stock.';
    END IF;

    v_total := ROUND(p_quantity * v_product.selling_price, 2);
    IF v_total <= 0 OR v_total > 9999999999.99 THEN
        RAISE EXCEPTION 'Sale total must be positive and within the supported amount range.';
    END IF;

    IF p_payment_method = 'credit' THEN
        IF p_customer_id IS NULL OR p_due_date IS NULL
           OR p_due_date < p_transaction_date THEN
            RAISE EXCEPTION 'Choose a customer and a due date on or after the sale date for a credit sale.';
        END IF;
    ELSIF p_due_date IS NOT NULL THEN
        RAISE EXCEPTION 'Due date is only valid for a credit sale.';
    END IF;

    IF p_customer_id IS NOT NULL THEN
        SELECT * INTO v_customer
        FROM public.parties
        WHERE id = p_customer_id
          AND business_id = p_business_id
          AND type IN ('customer', 'both');

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Customer not found in this business.' USING ERRCODE = 'P0002';
        END IF;
    END IF;

    v_type := CASE
        WHEN p_payment_method = 'credit' THEN 'customer_credit_sale'
        ELSE 'income'
    END;

    INSERT INTO public.transactions (
        business_id, type, party_id, amount, category, payment_method,
        description, due_date, transaction_date
    ) VALUES (
        p_business_id,
        v_type,
        p_customer_id,
        v_total,
        'Product sale',
        p_payment_method,
        COALESCE(NULLIF(BTRIM(p_description), ''), 'Sold ' || v_product.name),
        CASE WHEN p_payment_method = 'credit' THEN p_due_date ELSE NULL END,
        p_transaction_date
    ) RETURNING id INTO v_transaction_id;

    PERFORM public.record_stock_movement(
        p_business_id,
        p_product_id,
        'sale',
        p_quantity,
        v_product.purchase_price,
        'Product sale',
        v_transaction_id,
        'decrease',
        p_actor_id,
        p_actor_name
    );

    INSERT INTO public.audit_log (
        business_id, entity_type, entity_id, action, actor_id, actor_name, changes
    ) VALUES (
        p_business_id, 'transaction', v_transaction_id, 'insert',
        COALESCE(NULLIF(BTRIM(p_actor_id), ''), 'demo-owner'),
        NULLIF(BTRIM(p_actor_name), ''),
        jsonb_build_object('before', NULL, 'after', jsonb_build_object(
            'id', v_transaction_id, 'type', v_type,
            'product_id', p_product_id, 'customer_id', p_customer_id,
            'quantity', p_quantity, 'amount', v_total,
            'payment_method', p_payment_method, 'due_date', p_due_date
        ))
    );

    RETURN v_transaction_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_product_sale(
    uuid, uuid, numeric, uuid, text, date, date, text, text, text
) TO anon;

-- Creates an order and immediately records its paid-now cash expense.
DROP FUNCTION IF EXISTS public.create_supplier_order(
    uuid, uuid, text, text, numeric, date, date, text, text, text, text, text
);

CREATE OR REPLACE FUNCTION public.create_supplier_order(
    p_business_id uuid,
    p_supplier_id uuid,
    p_product_id uuid,
    p_quantity numeric,
    p_items text,
    p_category text,
    p_total_amount numeric,
    p_order_date date,
    p_due_date date,
    p_payment_type text,
    p_payment_method text,
    p_attachment_url text,
    p_actor_id text,
    p_actor_name text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_supplier public.parties%ROWTYPE;
    v_product public.products%ROWTYPE;
    v_order public.supplier_orders%ROWTYPE;
    v_transaction_id uuid;
    v_payment_id uuid;
BEGIN
    IF p_items IS NULL OR NULLIF(BTRIM(p_items), '') IS NULL THEN
        RAISE EXCEPTION 'Choose a product for this order.';
    END IF;
    IF p_product_id IS NULL THEN
        RAISE EXCEPTION 'Choose a product for this order.';
    END IF;
    IF p_quantity IS NULL OR p_quantity <= 0
       OR p_quantity > 9999999999.99
       OR p_quantity <> ROUND(p_quantity, 2) THEN
        RAISE EXCEPTION 'Quantity must be positive with at most 2 decimal places.';
    END IF;
    IF p_category IS NULL OR NULLIF(BTRIM(p_category), '') IS NULL THEN
        RAISE EXCEPTION 'Choose an order category.';
    END IF;
    IF p_total_amount IS NULL OR p_total_amount <= 0
       OR p_total_amount > 9999999999.99
       OR p_total_amount <> ROUND(p_total_amount, 2) THEN
        RAISE EXCEPTION 'Order amount must be positive with at most 2 decimal places.';
    END IF;
    IF p_order_date IS NULL
       OR p_order_date > (now() AT TIME ZONE 'Asia/Kathmandu')::date THEN
        RAISE EXCEPTION 'Order date cannot be in the future.';
    END IF;
    IF p_due_date IS NULL OR p_due_date < p_order_date THEN
        RAISE EXCEPTION 'Due date is required and must be on or after the order date.';
    END IF;
    IF p_payment_type IS NULL OR p_payment_type NOT IN ('paid_now', 'credit') THEN
        RAISE EXCEPTION 'Choose Paid now or On credit.';
    END IF;
    IF p_payment_type = 'paid_now'
       AND (p_payment_method IS NULL
            OR p_payment_method NOT IN ('cash', 'bank', 'qr', 'online')) THEN
        RAISE EXCEPTION 'Choose a valid payment method for a paid order.';
    END IF;

    SELECT * INTO v_supplier
    FROM public.parties
    WHERE id = p_supplier_id
      AND business_id = p_business_id
      AND type IN ('supplier', 'both')
    FOR KEY SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Supplier not found in this business.' USING ERRCODE = 'P0002';
    END IF;

    SELECT * INTO v_product
    FROM public.products
    WHERE id = p_product_id
      AND business_id = p_business_id
      AND is_active = true
    FOR KEY SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Active product not found in this business.' USING ERRCODE = 'P0002';
    END IF;

    INSERT INTO public.supplier_orders (
        business_id, supplier_id, product_id, quantity, items, category,
        total_amount, order_date, due_date, status, attachment_url
    ) VALUES (
        p_business_id, p_supplier_id, v_product.id, p_quantity,
        BTRIM(v_product.name), BTRIM(p_category), p_total_amount,
        p_order_date, p_due_date, 'ordered',
        NULLIF(BTRIM(p_attachment_url), '')
    )
    RETURNING * INTO v_order;

    IF p_payment_type = 'paid_now' THEN
        INSERT INTO public.transactions (
            business_id, supplier_order_id, type, party_id, amount, category,
            payment_method, description, transaction_date, attachment_url
        ) VALUES (
            p_business_id, v_order.id, 'expense', p_supplier_id,
            p_total_amount, BTRIM(p_category), p_payment_method,
            'Supplier order ' || LEFT(v_order.id::text, 8) || ': ' || v_order.items,
            p_order_date, NULLIF(BTRIM(p_attachment_url), '')
        )
        RETURNING id INTO v_transaction_id;

        INSERT INTO public.supplier_order_payments (
            business_id, order_id, supplier_id, amount, payment_method,
            payment_date, transaction_id
        ) VALUES (
            p_business_id, v_order.id, p_supplier_id, p_total_amount,
            p_payment_method, p_order_date, v_transaction_id
        )
        RETURNING id INTO v_payment_id;

        INSERT INTO public.audit_log (
            business_id, entity_type, entity_id, action, actor_id, actor_name, changes
        ) VALUES (
            p_business_id, 'transaction', v_transaction_id, 'insert',
            COALESCE(NULLIF(BTRIM(p_actor_id), ''), 'demo-owner'),
            NULLIF(BTRIM(p_actor_name), ''),
            jsonb_build_object('before', NULL, 'after', jsonb_build_object(
                'id', v_transaction_id, 'type', 'expense',
                'supplier_order_id', v_order.id, 'party_id', p_supplier_id,
                'amount', p_total_amount, 'payment_method', p_payment_method
            ))
        );
    END IF;

    INSERT INTO public.audit_log (
        business_id, entity_type, entity_id, action, actor_id, actor_name, changes
    ) VALUES (
        p_business_id, 'supplier_order', v_order.id, 'insert',
        COALESCE(NULLIF(BTRIM(p_actor_id), ''), 'demo-owner'),
        NULLIF(BTRIM(p_actor_name), ''),
        jsonb_build_object('before', NULL, 'after', jsonb_build_object(
            'id', v_order.id, 'supplier_id', p_supplier_id, 'items', v_order.items,
            'product_id', v_product.id, 'quantity', p_quantity,
            'total_amount', p_total_amount, 'category', BTRIM(p_category),
            'order_date', p_order_date, 'due_date', p_due_date,
            'payment_type', p_payment_type, 'payment_id', v_payment_id
        ))
    );

    RETURN v_order.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_supplier_order(
    uuid, uuid, uuid, numeric, text, text, numeric, date, date, text, text, text, text, text
) TO anon;

-- Receiving a credit order creates its payable; reversing receipt removes it.
CREATE OR REPLACE FUNCTION public.set_supplier_order_status(
    p_business_id uuid,
    p_order_id uuid,
    p_target_status text,
    p_actor_id text,
    p_actor_name text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_order public.supplier_orders%ROWTYPE;
    v_purchase public.transactions%ROWTYPE;
    v_product public.products%ROWTYPE;
    v_paid_amount numeric(12,2);
    v_transaction_id uuid;
    v_movement_id uuid;
    v_new_stock numeric;
    v_unit_cost numeric;
BEGIN
    IF p_target_status IS NULL OR p_target_status NOT IN ('ordered', 'received') THEN
        RAISE EXCEPTION 'Orders can only be moved between Ordered and Received.';
    END IF;

    SELECT * INTO v_order
    FROM public.supplier_orders
    WHERE id = p_order_id AND business_id = p_business_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Supplier order not found.' USING ERRCODE = 'P0002';
    END IF;

    IF v_order.status = p_target_status THEN
        RETURN v_order.id;
    END IF;

    SELECT COALESCE(SUM(amount), 0) INTO v_paid_amount
    FROM public.supplier_order_payments
    WHERE business_id = p_business_id AND order_id = v_order.id;

    IF p_target_status = 'received' THEN
        IF v_order.product_id IS NULL OR v_order.quantity IS NULL THEN
            RAISE EXCEPTION 'This order is missing its product quantity. Create a product-linked order before receiving it.';
        END IF;

        SELECT * INTO v_product
        FROM public.products
        WHERE id = v_order.product_id AND business_id = p_business_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'The order product was not found in this business.' USING ERRCODE = 'P0002';
        END IF;

        IF v_paid_amount < v_order.total_amount THEN
            INSERT INTO public.transactions (
                business_id, supplier_order_id, type, party_id, amount,
                category, payment_method, description, due_date, transaction_date,
                attachment_url
            ) VALUES (
                p_business_id, v_order.id, 'supplier_purchase', v_order.supplier_id,
                v_order.total_amount, v_order.category, 'credit',
                'Received supplier order ' || LEFT(v_order.id::text, 8) || ': ' || v_order.items,
                v_order.due_date, (now() AT TIME ZONE 'Asia/Kathmandu')::date,
                v_order.attachment_url
            )
            RETURNING id INTO v_transaction_id;

            INSERT INTO public.audit_log (
                business_id, entity_type, entity_id, action, actor_id, actor_name, changes
            ) VALUES (
                p_business_id, 'transaction', v_transaction_id, 'insert',
                COALESCE(NULLIF(BTRIM(p_actor_id), ''), 'demo-owner'),
                NULLIF(BTRIM(p_actor_name), ''),
                jsonb_build_object('before', NULL, 'after', jsonb_build_object(
                    'id', v_transaction_id, 'type', 'supplier_purchase',
                    'supplier_order_id', v_order.id, 'party_id', v_order.supplier_id,
                    'amount', v_order.total_amount, 'payment_method', 'credit'
                ))
            );
        ELSE
            SELECT id INTO v_transaction_id
            FROM public.transactions
            WHERE business_id = p_business_id
              AND supplier_order_id = v_order.id
              AND type = 'expense'
            LIMIT 1;
        END IF;

        IF v_transaction_id IS NULL THEN
            RAISE EXCEPTION 'The order purchase transaction could not be found.';
        END IF;

        v_new_stock := v_product.current_stock + v_order.quantity;
        IF v_new_stock > 9999999999.99 THEN
            RAISE EXCEPTION 'Receiving this order would exceed the product stock limit.';
        END IF;
        v_unit_cost := ROUND(v_order.total_amount / v_order.quantity, 2);
        IF v_unit_cost > 9999999999.99 THEN
            RAISE EXCEPTION 'The order unit cost exceeds the stock movement limit.';
        END IF;

        UPDATE public.products
        SET current_stock = v_new_stock
        WHERE id = v_product.id AND business_id = p_business_id;

        INSERT INTO public.stock_movements (
            business_id, product_id, transaction_id, type, quantity, unit_cost, reason
        ) VALUES (
            p_business_id, v_product.id, v_transaction_id, 'purchase',
            v_order.quantity, v_unit_cost,
            'Received supplier order ' || LEFT(v_order.id::text, 8)
        )
        RETURNING id INTO v_movement_id;

        INSERT INTO public.audit_log (
            business_id, entity_type, entity_id, action, actor_id, actor_name, changes
        ) VALUES (
            p_business_id, 'product', v_product.id, 'update',
            COALESCE(NULLIF(BTRIM(p_actor_id), ''), 'demo-owner'),
            NULLIF(BTRIM(p_actor_name), ''),
            jsonb_build_object(
                'before', jsonb_build_object('current_stock', v_product.current_stock),
                'after', jsonb_build_object('current_stock', v_new_stock),
                'movement', jsonb_build_object(
                    'id', v_movement_id, 'type', 'purchase',
                    'quantity', v_order.quantity, 'transaction_id', v_transaction_id,
                    'supplier_order_id', v_order.id
                )
            )
        );

        UPDATE public.supplier_orders
        SET status = 'received', received_at = now()
        WHERE id = v_order.id AND business_id = p_business_id;
    ELSE
        IF v_paid_amount > 0 THEN
            RAISE EXCEPTION 'An order with recorded payments cannot be moved back to Ordered.';
        END IF;

        IF v_order.product_id IS NOT NULL AND v_order.quantity IS NOT NULL THEN
            SELECT * INTO v_product
            FROM public.products
            WHERE id = v_order.product_id AND business_id = p_business_id
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'The order product was not found in this business.' USING ERRCODE = 'P0002';
            END IF;

            v_new_stock := v_product.current_stock - v_order.quantity;
            IF v_new_stock < 0 THEN
                RAISE EXCEPTION 'This receipt cannot be reversed because some of its stock has already been sold or removed.';
            END IF;
            v_unit_cost := ROUND(v_order.total_amount / v_order.quantity, 2);
            IF v_unit_cost > 9999999999.99 THEN
                RAISE EXCEPTION 'The order unit cost exceeds the stock movement limit.';
            END IF;

            UPDATE public.products
            SET current_stock = v_new_stock
            WHERE id = v_product.id AND business_id = p_business_id;

            INSERT INTO public.stock_movements (
                business_id, product_id, transaction_id, type, quantity, unit_cost, reason
            ) VALUES (
                p_business_id, v_product.id, NULL, 'adjustment',
                v_order.quantity, v_unit_cost,
                'Decrease: Supplier order ' || LEFT(v_order.id::text, 8) || ' receipt reversed'
            )
            RETURNING id INTO v_movement_id;

            INSERT INTO public.audit_log (
                business_id, entity_type, entity_id, action, actor_id, actor_name, changes
            ) VALUES (
                p_business_id, 'product', v_product.id, 'update',
                COALESCE(NULLIF(BTRIM(p_actor_id), ''), 'demo-owner'),
                NULLIF(BTRIM(p_actor_name), ''),
                jsonb_build_object(
                    'before', jsonb_build_object('current_stock', v_product.current_stock),
                    'after', jsonb_build_object('current_stock', v_new_stock),
                    'movement', jsonb_build_object(
                        'id', v_movement_id, 'type', 'adjustment',
                        'quantity', v_order.quantity,
                        'reason', 'Decrease: Supplier order receipt reversed',
                        'supplier_order_id', v_order.id
                    )
                )
            );
        END IF;

        SELECT * INTO v_purchase
        FROM public.transactions
        WHERE business_id = p_business_id
          AND supplier_order_id = v_order.id
          AND type = 'supplier_purchase'
        FOR UPDATE;

        IF FOUND THEN
            DELETE FROM public.transactions WHERE id = v_purchase.id;
            INSERT INTO public.audit_log (
                business_id, entity_type, entity_id, action, actor_id, actor_name, changes
            ) VALUES (
                p_business_id, 'transaction', v_purchase.id, 'delete',
                COALESCE(NULLIF(BTRIM(p_actor_id), ''), 'demo-owner'),
                NULLIF(BTRIM(p_actor_name), ''),
                jsonb_build_object('before', to_jsonb(v_purchase), 'after', NULL)
            );
        END IF;

        UPDATE public.supplier_orders
        SET status = 'ordered', received_at = NULL
        WHERE id = v_order.id AND business_id = p_business_id;
    END IF;

    INSERT INTO public.audit_log (
        business_id, entity_type, entity_id, action, actor_id, actor_name, changes
    ) VALUES (
        p_business_id, 'supplier_order', v_order.id, 'update',
        COALESCE(NULLIF(BTRIM(p_actor_id), ''), 'demo-owner'),
        NULLIF(BTRIM(p_actor_name), ''),
        jsonb_build_object(
            'before', jsonb_build_object('status', v_order.status),
            'after', jsonb_build_object('status', p_target_status)
        )
    );

    RETURN v_order.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_supplier_order_status(
    uuid, uuid, text, text, text
) TO anon;

-- Allocates a supplier payment to a selected order or received orders FIFO.
CREATE OR REPLACE FUNCTION public.record_supplier_order_payment(
    p_business_id uuid,
    p_supplier_id uuid,
    p_amount numeric,
    p_payment_method text,
    p_payment_date date,
    p_order_id uuid,
    p_actor_id text,
    p_actor_name text
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_supplier public.parties%ROWTYPE;
    v_order public.supplier_orders%ROWTYPE;
    v_legacy_payable numeric(12,2) := 0;
    v_order_payable numeric(12,2) := 0;
    v_total_payable numeric(12,2) := 0;
    v_paid_amount numeric(12,2) := 0;
    v_outstanding numeric(12,2) := 0;
    v_remaining numeric(12,2) := 0;
    v_allocated numeric(12,2) := 0;
    v_legacy_amount numeric(12,2) := 0;
    v_transaction_id uuid;
    v_payment_id uuid;
    v_allocations jsonb := '[]'::jsonb;
BEGIN
    IF p_amount IS NULL OR p_amount <= 0
       OR p_amount > 9999999999.99
       OR p_amount <> ROUND(p_amount, 2) THEN
        RAISE EXCEPTION 'Payment must be positive with at most 2 decimal places.';
    END IF;
    IF p_payment_method IS NULL
       OR p_payment_method NOT IN ('cash', 'bank', 'qr', 'online') THEN
        RAISE EXCEPTION 'Choose a valid supplier payment method.';
    END IF;
    IF p_payment_date IS NULL
       OR p_payment_date > (now() AT TIME ZONE 'Asia/Kathmandu')::date THEN
        RAISE EXCEPTION 'Payment date cannot be in the future.';
    END IF;

    SELECT * INTO v_supplier
    FROM public.parties
    WHERE id = p_supplier_id
      AND business_id = p_business_id
      AND type IN ('supplier', 'both')
    FOR KEY SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Supplier not found in this business.' USING ERRCODE = 'P0002';
    END IF;

    IF p_order_id IS NOT NULL THEN
        SELECT * INTO v_order
        FROM public.supplier_orders
        WHERE id = p_order_id
          AND business_id = p_business_id
          AND supplier_id = p_supplier_id
          AND status = 'received'
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Choose a received order for this supplier.';
        END IF;

        SELECT COALESCE(SUM(amount), 0) INTO v_paid_amount
        FROM public.supplier_order_payments
        WHERE business_id = p_business_id AND order_id = v_order.id;
        v_outstanding := v_order.total_amount - v_paid_amount;

        IF p_amount > v_outstanding THEN
            RAISE EXCEPTION 'Payment exceeds this order''s outstanding amount.';
        END IF;

        INSERT INTO public.transactions (
            business_id, supplier_order_id, type, party_id, amount, category,
            payment_method, description, transaction_date
        ) VALUES (
            p_business_id, v_order.id, 'supplier_payment', p_supplier_id,
            p_amount, 'Supplier order payment', p_payment_method,
            'Payment for supplier order ' || LEFT(v_order.id::text, 8),
            p_payment_date
        )
        RETURNING id INTO v_transaction_id;

        INSERT INTO public.supplier_order_payments (
            business_id, order_id, supplier_id, amount, payment_method,
            payment_date, transaction_id
        ) VALUES (
            p_business_id, v_order.id, p_supplier_id, p_amount,
            p_payment_method, p_payment_date, v_transaction_id
        )
        RETURNING id INTO v_payment_id;

        INSERT INTO public.audit_log (
            business_id, entity_type, entity_id, action, actor_id, actor_name, changes
        ) VALUES (
            p_business_id, 'transaction', v_transaction_id, 'insert',
            COALESCE(NULLIF(BTRIM(p_actor_id), ''), 'demo-owner'),
            NULLIF(BTRIM(p_actor_name), ''),
            jsonb_build_object('before', NULL, 'after', jsonb_build_object(
                'id', v_transaction_id, 'type', 'supplier_payment',
                'supplier_order_id', v_order.id, 'payment_id', v_payment_id,
                'party_id', p_supplier_id, 'amount', p_amount,
                'payment_method', p_payment_method
            ))
        );

        RETURN jsonb_build_object(
            'allocations', jsonb_build_array(jsonb_build_object(
                'order_id', v_order.id, 'amount', p_amount
            )),
            'legacy_amount', 0
        );
    END IF;

    PERFORM id
    FROM public.transactions
    WHERE business_id = p_business_id
      AND party_id = p_supplier_id
      AND supplier_order_id IS NULL
      AND type IN ('supplier_purchase', 'supplier_payment')
    FOR UPDATE;

    SELECT COALESCE(SUM(
        CASE
            WHEN type = 'supplier_purchase' AND payment_method = 'credit' THEN amount
            WHEN type = 'supplier_payment' THEN -amount
            ELSE 0
        END
    ), 0) INTO v_legacy_payable
    FROM public.transactions
    WHERE business_id = p_business_id
      AND party_id = p_supplier_id
      AND supplier_order_id IS NULL
      AND type IN ('supplier_purchase', 'supplier_payment');
    v_legacy_payable := GREATEST(v_legacy_payable, 0);

    FOR v_order IN
        SELECT * FROM public.supplier_orders
        WHERE business_id = p_business_id
          AND supplier_id = p_supplier_id
          AND status = 'received'
        ORDER BY order_date, created_at, id
        FOR UPDATE
    LOOP
        SELECT COALESCE(SUM(amount), 0) INTO v_paid_amount
        FROM public.supplier_order_payments
        WHERE business_id = p_business_id AND order_id = v_order.id;
        v_order_payable := v_order_payable
            + GREATEST(v_order.total_amount - v_paid_amount, 0);
    END LOOP;

    v_total_payable := v_legacy_payable + v_order_payable;
    IF p_amount > v_total_payable THEN
        RAISE EXCEPTION 'Payment exceeds the outstanding payable.';
    END IF;

    v_remaining := p_amount;
    FOR v_order IN
        SELECT * FROM public.supplier_orders
        WHERE business_id = p_business_id
          AND supplier_id = p_supplier_id
          AND status = 'received'
        ORDER BY order_date, created_at, id
        FOR UPDATE
    LOOP
        EXIT WHEN v_remaining = 0;

        SELECT COALESCE(SUM(amount), 0) INTO v_paid_amount
        FROM public.supplier_order_payments
        WHERE business_id = p_business_id AND order_id = v_order.id;
        v_outstanding := GREATEST(v_order.total_amount - v_paid_amount, 0);
        IF v_outstanding = 0 THEN
            CONTINUE;
        END IF;

        v_allocated := LEAST(v_remaining, v_outstanding);
        INSERT INTO public.transactions (
            business_id, supplier_order_id, type, party_id, amount, category,
            payment_method, description, transaction_date
        ) VALUES (
            p_business_id, v_order.id, 'supplier_payment', p_supplier_id,
            v_allocated, 'Supplier order payment',
            p_payment_method,
            'FIFO payment for supplier order ' || LEFT(v_order.id::text, 8),
            p_payment_date
        )
        RETURNING id INTO v_transaction_id;

        INSERT INTO public.supplier_order_payments (
            business_id, order_id, supplier_id, amount, payment_method,
            payment_date, transaction_id
        ) VALUES (
            p_business_id, v_order.id, p_supplier_id, v_allocated,
            p_payment_method, p_payment_date, v_transaction_id
        )
        RETURNING id INTO v_payment_id;

        INSERT INTO public.audit_log (
            business_id, entity_type, entity_id, action, actor_id, actor_name, changes
        ) VALUES (
            p_business_id, 'transaction', v_transaction_id, 'insert',
            COALESCE(NULLIF(BTRIM(p_actor_id), ''), 'demo-owner'),
            NULLIF(BTRIM(p_actor_name), ''),
            jsonb_build_object('before', NULL, 'after', jsonb_build_object(
                'id', v_transaction_id, 'type', 'supplier_payment',
                'supplier_order_id', v_order.id, 'payment_id', v_payment_id,
                'party_id', p_supplier_id, 'amount', v_allocated,
                'payment_method', p_payment_method
            ))
        );

        v_allocations := v_allocations || jsonb_build_array(jsonb_build_object(
            'order_id', v_order.id, 'amount', v_allocated
        ));
        v_remaining := v_remaining - v_allocated;
    END LOOP;

    IF v_remaining > 0 THEN
        v_legacy_amount := v_remaining;
        INSERT INTO public.transactions (
            business_id, type, party_id, amount, category, payment_method,
            description, transaction_date
        ) VALUES (
            p_business_id, 'supplier_payment', p_supplier_id, v_remaining,
            'Supplier payment', p_payment_method,
            'Payment applied to existing supplier payable', p_payment_date
        )
        RETURNING id INTO v_transaction_id;

        INSERT INTO public.audit_log (
            business_id, entity_type, entity_id, action, actor_id, actor_name, changes
        ) VALUES (
            p_business_id, 'transaction', v_transaction_id, 'insert',
            COALESCE(NULLIF(BTRIM(p_actor_id), ''), 'demo-owner'),
            NULLIF(BTRIM(p_actor_name), ''),
            jsonb_build_object('before', NULL, 'after', jsonb_build_object(
                'id', v_transaction_id, 'type', 'supplier_payment',
                'party_id', p_supplier_id, 'amount', v_remaining,
                'payment_method', p_payment_method
            ))
        );
    END IF;

    RETURN jsonb_build_object(
        'allocations', v_allocations,
        'legacy_amount', v_legacy_amount
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_supplier_order_payment(
    uuid, uuid, numeric, text, date, uuid, text, text
) TO anon;
