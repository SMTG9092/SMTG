-- ============================================
-- SMTG ERP
-- 003 - Pricing, Contracts and Subscriptions
-- ============================================

-- 1. Module groups
CREATE TABLE platform.module_groups (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Modules
CREATE TABLE platform.modules (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_id BIGINT NOT NULL
        REFERENCES platform.module_groups(id),
    module_code VARCHAR(80) NOT NULL UNIQUE,
    module_name VARCHAR(150) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Pricing catalog
CREATE TABLE platform.pricing_catalog (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    item_code VARCHAR(100) NOT NULL UNIQUE,
    item_name VARCHAR(200) NOT NULL,
    item_type VARCHAR(30) NOT NULL
        CHECK (item_type IN (
            'module',
            'storage',
            'employee',
            'branch',
            'department',
            'other'
        )),
    billing_unit VARCHAR(30) NOT NULL
        CHECK (billing_unit IN (
            'year',
            'month',
            'gb_year',
            'employee_year',
            'branch_year',
            'fixed'
        )),
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (unit_price >= 0),
    currency CHAR(3) NOT NULL DEFAULT 'MAD',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Module pricing link
CREATE TABLE platform.module_pricing (
    module_id BIGINT PRIMARY KEY
        REFERENCES platform.modules(id),
    pricing_item_id BIGINT NOT NULL
        REFERENCES platform.pricing_catalog(id)
);


-- ============================================
-- 5. Company contracts
-- ============================================

CREATE TABLE platform.company_contracts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id BIGINT NOT NULL
        REFERENCES platform.companies(id),

    contract_number VARCHAR(100) NOT NULL UNIQUE,

    contract_status VARCHAR(30) NOT NULL DEFAULT 'draft'
        CHECK (contract_status IN (
            'draft',
            'pending_payment',
            'active',
            'expired',
            'cancelled'
        )),

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    agreed_employee_count INTEGER NOT NULL DEFAULT 0
        CHECK (agreed_employee_count >= 0),

    included_employee_yearly_price NUMERIC(12,2)
        NOT NULL DEFAULT 0
        CHECK (included_employee_yearly_price >= 0),

    additional_employee_yearly_price NUMERIC(12,2)
        NOT NULL DEFAULT 0
        CHECK (additional_employee_yearly_price >= 0),

    currency CHAR(3) NOT NULL DEFAULT 'MAD',

    annual_total NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (annual_total >= 0),

    contract_notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (end_date >= start_date)
);

-- ============================================
-- 6. Contract items
-- Prices are snapshots from contract date
-- ============================================

CREATE TABLE platform.contract_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    contract_id BIGINT NOT NULL
        REFERENCES platform.company_contracts(id),

    pricing_item_id BIGINT
        REFERENCES platform.pricing_catalog(id),

    item_code_snapshot VARCHAR(100) NOT NULL,
    item_name_snapshot VARCHAR(200) NOT NULL,

    item_type VARCHAR(30) NOT NULL,

    quantity NUMERIC(12,2) NOT NULL DEFAULT 1
        CHECK (quantity >= 0),

    unit_price NUMERIC(12,2) NOT NULL
        CHECK (unit_price >= 0),

    billing_unit VARCHAR(30) NOT NULL,

    line_total NUMERIC(14,2) NOT NULL
        CHECK (line_total >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. Contract limits
-- Limits agreed with each company
-- ============================================

CREATE TABLE platform.contract_limits (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    contract_id BIGINT NOT NULL UNIQUE
        REFERENCES platform.company_contracts(id),

    max_employees INTEGER NOT NULL DEFAULT 0
        CHECK (max_employees >= 0),

    max_branches INTEGER NOT NULL DEFAULT 0
        CHECK (max_branches >= 0),

    max_departments INTEGER NOT NULL DEFAULT 0
        CHECK (max_departments >= 0),

    storage_limit_gb NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (storage_limit_gb >= 0),

    max_admin_users INTEGER NOT NULL DEFAULT 1
        CHECK (max_admin_users >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 8. Contract indexes
-- ============================================

CREATE INDEX idx_contracts_company
    ON platform.company_contracts(company_id);

CREATE INDEX idx_contracts_status
    ON platform.company_contracts(contract_status);

CREATE INDEX idx_contract_items_contract
    ON platform.contract_items(contract_id);


-- ============================================
-- 9. Contract additions
-- ============================================

CREATE TABLE platform.contract_addons (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    contract_id BIGINT NOT NULL
        REFERENCES platform.company_contracts(id),

    addon_type VARCHAR(30) NOT NULL
        CHECK (addon_type IN (
            'employee',
            'module',
            'storage',
            'branch',
            'department',
            'other'
        )),

    description VARCHAR(250) NOT NULL,

    quantity NUMERIC(12,2) NOT NULL DEFAULT 1
        CHECK (quantity > 0),

    annual_unit_price NUMERIC(12,2) NOT NULL
        CHECK (annual_unit_price >= 0),

    effective_date DATE NOT NULL,
    contract_end_date DATE NOT NULL,

    remaining_days INTEGER NOT NULL
        CHECK (remaining_days >= 0),

    total_contract_days INTEGER NOT NULL
        CHECK (total_contract_days > 0),

    prorata_amount NUMERIC(14,2) NOT NULL
        CHECK (prorata_amount >= 0),

    approval_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (approval_status IN (
            'pending',
            'approved',
            'rejected',
            'cancelled'
        )),

    requested_by BIGINT REFERENCES platform.users(id),
    approved_by BIGINT REFERENCES platform.users(id),
    approved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (contract_end_date >= effective_date),
    CHECK (remaining_days <= total_contract_days)
);

CREATE INDEX idx_contract_addons_contract
    ON platform.contract_addons(contract_id);

CREATE INDEX idx_contract_addons_status
    ON platform.contract_addons(approval_status);


-- ============================================
-- 10. Subscriptions
-- ============================================

CREATE TABLE platform.subscriptions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    company_id BIGINT NOT NULL
        REFERENCES platform.companies(id),

    contract_id BIGINT NOT NULL UNIQUE
        REFERENCES platform.company_contracts(id),

    subscription_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (subscription_status IN (
            'pending',
            'active',
            'expired',
            'suspended',
            'cancelled'
        )),

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    activated_at TIMESTAMPTZ,
    suspended_at TIMESTAMPTZ,

    is_lifetime BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (end_date >= start_date)
);

CREATE INDEX idx_subscriptions_company
    ON platform.subscriptions(company_id);

CREATE INDEX idx_subscriptions_status
    ON platform.subscriptions(subscription_status);


-- ============================================
-- 11. Subscription history
-- ============================================

CREATE TABLE platform.subscription_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    subscription_id BIGINT NOT NULL
        REFERENCES platform.subscriptions(id),

    action_type VARCHAR(40) NOT NULL
        CHECK (action_type IN (
            'created',
            'activated',
            'renewed',
            'extended',
            'suspended',
            'reactivated',
            'cancelled',
            'expired',
            'limits_changed'
        )),

    old_status VARCHAR(20),
    new_status VARCHAR(20),

    old_end_date DATE,
    new_end_date DATE,

    action_reason TEXT,

    performed_by BIGINT REFERENCES platform.users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscription_history_subscription
    ON platform.subscription_history(subscription_id);


-- ============================================
-- 12. Subscription payments
-- Manual and online payments
-- ============================================

CREATE TABLE platform.subscription_payments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    subscription_id BIGINT NOT NULL
        REFERENCES platform.subscriptions(id),

    contract_id BIGINT NOT NULL
        REFERENCES platform.company_contracts(id),

    amount NUMERIC(14,2) NOT NULL
        CHECK (amount > 0),

    currency CHAR(3) NOT NULL DEFAULT 'MAD',

    payment_method VARCHAR(20) NOT NULL
        CHECK (payment_method IN (
            'bank_transfer',
            'cash',
            'online'
        )),

    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (payment_status IN (
            'pending',
            'under_review',
            'confirmed',
            'rejected',
            'refunded'
        )),

    payment_reference VARCHAR(200),

    proof_file_path TEXT,

    provider_name VARCHAR(100),
    provider_transaction_id VARCHAR(200),

    verified_by BIGINT REFERENCES platform.users(id),
    verified_at TIMESTAMPTZ,

    paid_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscription_payments_subscription
    ON platform.subscription_payments(subscription_id);

CREATE INDEX idx_subscription_payments_status
    ON platform.subscription_payments(payment_status);


-- ============================================
-- 13. Online payment provider events
-- Prevent duplicate webhook processing
-- ============================================

CREATE TABLE platform.payment_provider_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    provider_name VARCHAR(100) NOT NULL,
    provider_event_id VARCHAR(250) NOT NULL,

    payment_id BIGINT
        REFERENCES platform.subscription_payments(id),

    event_type VARCHAR(150) NOT NULL,

    processing_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (processing_status IN (
            'pending',
            'processed',
            'failed'
        )),

    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,

    UNIQUE (provider_name, provider_event_id)
);

