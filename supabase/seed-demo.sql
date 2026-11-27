-- ==========================================
-- BIZTRACK DEMO SEED (presentation data)
-- ==========================================
-- Run this in the Supabase SQL editor after applying supabase/schema.sql.
--
-- It creates (or updates) the demo business "Himalayan Corner Shop" with:
--   * 5 customers and 4 suppliers
--   * 10 products, including two low-stock items
--   * ~20 recent transactions (income, expenses, credit sales, payments,
--     supplier purchases and supplier payments)
--   * matching stock movement history
--   * 3 supplier orders for the orders board
--
-- The first authenticated user is attached as an owner so the workspace is
-- visible in the app. Change v_owner_email below to target a specific account,
-- or set it to NULL to skip that step.
--
-- The whole block is idempotent: if the demo products already exist in the
-- target business, it does nothing.
-- ==========================================

DO $$
DECLARE
    -- Change this to your own business id to seed an existing workspace.
    v_business_id uuid := '11111111-1111-4111-8111-111111111111';
    v_owner_email text := NULL;  -- e.g. 'owner@example.com'; NULL = first user
    v_owner_id uuid;
    v_sku_suffix text;

    v_sita uuid;
    v_ram uuid;
    v_anjali uuid;
    v_bikash uuid;
    v_maya uuid;
    v_himalayan_tea uuid;
    v_wholesale uuid;
    v_annapurna uuid;
    v_everest_dairy uuid;

    v_rice uuid;
    v_sunflower_oil uuid;
    v_sugar uuid;
    v_tea uuid;
    v_milk_powder uuid;
    v_noodles uuid;
    v_honey uuid;
    v_fresh_milk uuid;
    v_chiura uuid;
    v_mustard_oil uuid;
BEGIN
    INSERT INTO public.businesses (id, name, business_type, currency, address)
    VALUES (
        v_business_id,
        'Himalayan Corner Shop',
        'Retail',
        'NPR',
        'Lakeside Road, Pokhara'
    )
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name;

    -- SKUs are globally unique, so scope them to the target business.
    v_sku_suffix := CASE
        WHEN v_business_id = '11111111-1111-4111-8111-111111111111' THEN ''
        ELSE '-' || left(replace(v_business_id::text, '-', ''), 4)
    END;

    -- Make the demo workspace visible to a real signed-in account.
    IF v_owner_email IS NOT NULL THEN
        SELECT id INTO v_owner_id
        FROM auth.users
        WHERE lower(email) = lower(v_owner_email)
        LIMIT 1;
    ELSE
        SELECT id INTO v_owner_id
        FROM auth.users
        ORDER BY created_at
        LIMIT 1;
    END IF;

    IF v_owner_id IS NOT NULL THEN
        INSERT INTO public.business_members (
            business_id, actor_id, user_id, role, is_active
        ) VALUES (
            v_business_id, v_owner_id::text, v_owner_id, 'owner', true
        )
        ON CONFLICT (business_id, user_id) DO UPDATE
        SET role = 'owner',
            is_active = true;
    END IF;

    -- Guard against re-seeding.
    IF EXISTS (
        SELECT 1 FROM public.products
        WHERE business_id = v_business_id AND sku = 'RICE-BAS-25' || v_sku_suffix
    ) THEN
        RAISE NOTICE 'Demo data already present for business %', v_business_id;
        RETURN;
    END IF;

    -- ---------- Parties ----------
    INSERT INTO public.parties (business_id, name, phone, type, address)
    VALUES (v_business_id, 'Sita Sharma', '9841000001', 'customer', 'Lakeside, Pokhara')
    RETURNING id INTO v_sita;

    INSERT INTO public.parties (business_id, name, phone, type, address)
    VALUES (v_business_id, 'Ram Bahadur Thapa', '9841000002', 'customer', 'Baglung Bazaar')
    RETURNING id INTO v_ram;

    INSERT INTO public.parties (business_id, name, phone, type, address)
    VALUES (v_business_id, 'Anjali Gurung', '9841000003', 'customer', 'Prithvi Chowk, Pokhara')
    RETURNING id INTO v_anjali;

    INSERT INTO public.parties (business_id, name, phone, type, address)
    VALUES (v_business_id, 'Bikash Shrestha', '9841000004', 'customer', 'New Road, Kathmandu')
    RETURNING id INTO v_bikash;

    INSERT INTO public.parties (business_id, name, phone, type, address)
    VALUES (v_business_id, 'Maya Devi Yadav', '9841000005', 'both', 'Janakpur')
    RETURNING id INTO v_maya;

    INSERT INTO public.parties (business_id, name, phone, type, address)
    VALUES (v_business_id, 'Himalayan Tea Traders', '9851000001', 'supplier', 'Ilam')
    RETURNING id INTO v_himalayan_tea;

    INSERT INTO public.parties (business_id, name, phone, type, address)
    VALUES (v_business_id, 'Kathmandu Wholesale Mart', '9851000002', 'supplier', 'Asan, Kathmandu')
    RETURNING id INTO v_wholesale;

    INSERT INTO public.parties (business_id, name, phone, type, address)
    VALUES (v_business_id, 'Annapurna Rice Mill', '9851000003', 'supplier', 'Chitwan')
    RETURNING id INTO v_annapurna;

    INSERT INTO public.parties (business_id, name, phone, type, address)
    VALUES (v_business_id, 'Everest Dairy Supply', '9851000004', 'supplier', 'Lalitpur')
    RETURNING id INTO v_everest_dairy;

    -- ---------- Products ----------
    INSERT INTO public.products (
        business_id, name, sku, category, purchase_price, selling_price,
        current_stock, min_stock, supplier_id, is_active
    ) VALUES (
        v_business_id, 'Basmati Rice 25 kg', 'RICE-BAS-25' || v_sku_suffix, 'Grains',
        1800, 2200, 42, 10, v_annapurna, true
    ) RETURNING id INTO v_rice;

    INSERT INTO public.products (
        business_id, name, sku, category, purchase_price, selling_price,
        current_stock, min_stock, supplier_id, is_active
    ) VALUES (
        v_business_id, 'Sunflower Oil 1 L', 'OIL-SUN-1L' || v_sku_suffix, 'Cooking Oil',
        210, 260, 18, 6, v_wholesale, true
    ) RETURNING id INTO v_sunflower_oil;

    INSERT INTO public.products (
        business_id, name, sku, category, purchase_price, selling_price,
        current_stock, min_stock, supplier_id, is_active
    ) VALUES (
        v_business_id, 'Sugar 1 kg', 'SUG-1KG' || v_sku_suffix, 'Groceries',
        95, 115, 64, 20, v_wholesale, true
    ) RETURNING id INTO v_sugar;

    INSERT INTO public.products (
        business_id, name, sku, category, purchase_price, selling_price,
        current_stock, min_stock, supplier_id, is_active
    ) VALUES (
        v_business_id, 'Ilam Black Tea 100 g', 'TEA-ILM-100' || v_sku_suffix, 'Beverages',
        160, 210, 9, 12, v_himalayan_tea, true
    ) RETURNING id INTO v_tea;

    INSERT INTO public.products (
        business_id, name, sku, category, purchase_price, selling_price,
        current_stock, min_stock, supplier_id, is_active
    ) VALUES (
        v_business_id, 'Everest Milk Powder 500 g', 'MILK-EVR-500' || v_sku_suffix, 'Dairy',
        380, 450, 24, 8, v_everest_dairy, true
    ) RETURNING id INTO v_milk_powder;

    INSERT INTO public.products (
        business_id, name, sku, category, purchase_price, selling_price,
        current_stock, min_stock, supplier_id, is_active
    ) VALUES (
        v_business_id, 'Wai Wai Noodles (pack)', 'NOOD-WW' || v_sku_suffix, 'Snacks',
        22, 30, 120, 30, v_wholesale, true
    ) RETURNING id INTO v_noodles;

    INSERT INTO public.products (
        business_id, name, sku, category, purchase_price, selling_price,
        current_stock, min_stock, supplier_id, is_active
    ) VALUES (
        v_business_id, 'Himalayan Honey 250 g', 'HON-HIM-250' || v_sku_suffix, 'Groceries',
        320, 420, 15, 5, v_himalayan_tea, true
    ) RETURNING id INTO v_honey;

    INSERT INTO public.products (
        business_id, name, sku, category, purchase_price, selling_price,
        current_stock, min_stock, supplier_id, is_active
    ) VALUES (
        v_business_id, 'Fresh Milk 1 L', 'MILK-FRS-1L' || v_sku_suffix, 'Dairy',
        90, 110, 5, 10, v_everest_dairy, true
    ) RETURNING id INTO v_fresh_milk;

    INSERT INTO public.products (
        business_id, name, sku, category, purchase_price, selling_price,
        current_stock, min_stock, supplier_id, is_active
    ) VALUES (
        v_business_id, 'Beaten Rice (Chiura) 1 kg', 'CHI-1KG' || v_sku_suffix, 'Grains',
        85, 105, 28, 10, v_annapurna, true
    ) RETURNING id INTO v_chiura;

    INSERT INTO public.products (
        business_id, name, sku, category, purchase_price, selling_price,
        current_stock, min_stock, supplier_id, is_active
    ) VALUES (
        v_business_id, 'Mustard Oil 1 L', 'OIL-MUS-1L' || v_sku_suffix, 'Cooking Oil',
        240, 300, 12, 6, v_wholesale, true
    ) RETURNING id INTO v_mustard_oil;

    -- ---------- Transactions ----------
    INSERT INTO public.transactions (
        business_id, type, party_id, amount, category, payment_method,
        description, due_date, transaction_date
    ) VALUES
        (v_business_id, 'income', NULL, 2200, 'Counter sale', 'cash',
         'Basmati rice 25 kg', NULL, CURRENT_DATE),
        (v_business_id, 'income', NULL, 1450, 'Counter sale', 'qr',
         'Groceries bundle', NULL, CURRENT_DATE),
        (v_business_id, 'income', NULL, 640, 'Counter sale', 'cash',
         'Tea and noodles', NULL, CURRENT_DATE),
        (v_business_id, 'income', NULL, 3200, 'Online order', 'online',
         'Online order #1042', NULL, CURRENT_DATE),
        (v_business_id, 'expense', NULL, 350, 'Transport', 'cash',
         'Local delivery charge', NULL, CURRENT_DATE),
        (v_business_id, 'expense', NULL, 2400, 'Utilities', 'bank',
         'Electricity bill', NULL, CURRENT_DATE),
        (v_business_id, 'expense', NULL, 500, 'Shop supplies', 'cash',
         'Bags and packaging', NULL, CURRENT_DATE - 1),

        (v_business_id, 'customer_credit_sale', v_sita, 4500, 'Credit sale', 'credit',
         'Monthly groceries on credit', CURRENT_DATE + 15, CURRENT_DATE - 2),
        (v_business_id, 'customer_credit_sale', v_ram, 2800, 'Credit sale', 'credit',
         'Rice and oil on credit', CURRENT_DATE - 5, CURRENT_DATE - 12),
        (v_business_id, 'customer_credit_sale', v_anjali, 1800, 'Credit sale', 'credit',
         'Tea and dairy items', CURRENT_DATE + 7, CURRENT_DATE - 3),
        (v_business_id, 'customer_credit_sale', v_bikash, 1200, 'Credit sale', 'credit',
         'Snacks for shop', CURRENT_DATE + 20, CURRENT_DATE - 1),

        (v_business_id, 'customer_payment', v_sita, 2000, 'Credit payment', 'cash',
         'Part payment against credit', NULL, CURRENT_DATE),
        (v_business_id, 'customer_payment', v_ram, 1000, 'Credit payment', 'qr',
         'Partial settlement', NULL, CURRENT_DATE - 1),

        (v_business_id, 'supplier_purchase', v_himalayan_tea, 12000, 'Stock purchase', 'credit',
         'Tea consignment', CURRENT_DATE + 20, CURRENT_DATE - 8),
        (v_business_id, 'supplier_purchase', v_wholesale, 6500, 'Stock purchase', 'cash',
         'Oil and sugar restock', NULL, CURRENT_DATE - 4),
        (v_business_id, 'supplier_purchase', v_everest_dairy, 3600, 'Stock purchase', 'credit',
         'Dairy restock', CURRENT_DATE - 3, CURRENT_DATE - 10),
        (v_business_id, 'supplier_purchase', v_annapurna, 18000, 'Stock purchase', 'credit',
         'Rice and chiura order', CURRENT_DATE + 25, CURRENT_DATE - 6),

        (v_business_id, 'supplier_payment', v_annapurna, 8000, 'Supplier payment', 'bank',
         'Payment against rice order', NULL, CURRENT_DATE - 2),
        (v_business_id, 'supplier_payment', v_wholesale, 3000, 'Supplier payment', 'cash',
         'Part payment to wholesaler', NULL, CURRENT_DATE - 1);

    -- ---------- Stock movements ----------
    INSERT INTO public.stock_movements (
        business_id, product_id, type, quantity, unit_cost, reason, created_at
    ) VALUES
        (v_business_id, v_rice, 'purchase', 60, 1800, 'Opening stock', CURRENT_DATE - 20),
        (v_business_id, v_rice, 'sale', 18, 1800, 'Counter sales', CURRENT_DATE - 2),
        (v_business_id, v_sunflower_oil, 'purchase', 24, 210, 'Opening stock', CURRENT_DATE - 20),
        (v_business_id, v_sunflower_oil, 'sale', 6, 210, 'Counter sales', CURRENT_DATE - 3),
        (v_business_id, v_sugar, 'purchase', 80, 95, 'Opening stock', CURRENT_DATE - 20),
        (v_business_id, v_sugar, 'sale', 16, 95, 'Counter sales', CURRENT_DATE - 2),
        (v_business_id, v_tea, 'purchase', 15, 160, 'Opening stock', CURRENT_DATE - 20),
        (v_business_id, v_tea, 'sale', 6, 160, 'Counter sales', CURRENT_DATE - 1),
        (v_business_id, v_milk_powder, 'purchase', 30, 380, 'Opening stock', CURRENT_DATE - 20),
        (v_business_id, v_milk_powder, 'sale', 6, 380, 'Counter sales', CURRENT_DATE - 4),
        (v_business_id, v_noodles, 'purchase', 150, 22, 'Opening stock', CURRENT_DATE - 20),
        (v_business_id, v_noodles, 'sale', 30, 22, 'Counter sales', CURRENT_DATE - 2),
        (v_business_id, v_honey, 'purchase', 20, 320, 'Opening stock', CURRENT_DATE - 20),
        (v_business_id, v_honey, 'sale', 5, 320, 'Counter sales', CURRENT_DATE - 5),
        (v_business_id, v_fresh_milk, 'purchase', 12, 90, 'Opening stock', CURRENT_DATE - 20),
        (v_business_id, v_fresh_milk, 'sale', 7, 90, 'Counter sales', CURRENT_DATE - 1),
        (v_business_id, v_chiura, 'purchase', 40, 85, 'Opening stock', CURRENT_DATE - 20),
        (v_business_id, v_chiura, 'sale', 12, 85, 'Counter sales', CURRENT_DATE - 3),
        (v_business_id, v_mustard_oil, 'purchase', 18, 240, 'Opening stock', CURRENT_DATE - 20),
        (v_business_id, v_mustard_oil, 'sale', 6, 240, 'Counter sales', CURRENT_DATE - 2);

    -- Keep current_stock consistent with the movement history.
    UPDATE public.products AS p
    SET current_stock = COALESCE((
        SELECT SUM(
            CASE
                WHEN sm.type = 'purchase' THEN sm.quantity
                WHEN sm.type IN ('sale', 'damaged', 'lost') THEN -sm.quantity
                WHEN sm.type = 'adjustment'
                     AND COALESCE(sm.reason, '') LIKE 'Decrease%' THEN -sm.quantity
                ELSE sm.quantity
            END
        )
        FROM public.stock_movements AS sm
        WHERE sm.business_id = p.business_id
          AND sm.product_id = p.id
    ), 0)
    WHERE p.business_id = v_business_id
      AND p.sku IN (
        'RICE-BAS-25' || v_sku_suffix, 'OIL-SUN-1L' || v_sku_suffix, 'SUG-1KG' || v_sku_suffix, 'TEA-ILM-100' || v_sku_suffix,
        'MILK-EVR-500' || v_sku_suffix, 'NOOD-WW' || v_sku_suffix, 'HON-HIM-250' || v_sku_suffix, 'MILK-FRS-1L' || v_sku_suffix,
        'CHI-1KG' || v_sku_suffix, 'OIL-MUS-1L' || v_sku_suffix
      );

    -- ---------- Supplier orders ----------
    INSERT INTO public.supplier_orders (
        business_id, supplier_id, product_id, quantity, items, category,
        total_amount, order_date, due_date, status, received_at
    ) VALUES
        (v_business_id, v_himalayan_tea, v_tea, 20, 'Ilam Black Tea 100 g x 20',
         'Beverages', 3200, CURRENT_DATE - 10, CURRENT_DATE + 5, 'ordered', NULL),
        (v_business_id, v_wholesale, v_sugar, 50, 'Sugar 1 kg x 50',
         'Groceries', 4750, CURRENT_DATE - 15, CURRENT_DATE + 10, 'received', CURRENT_DATE - 5),
        (v_business_id, v_annapurna, v_rice, 25, 'Basmati Rice 25 kg x 25',
         'Grains', 45000, CURRENT_DATE - 3, CURRENT_DATE + 20, 'ordered', NULL);

    RAISE NOTICE 'Demo data seeded for business %', v_business_id;
END $$;
