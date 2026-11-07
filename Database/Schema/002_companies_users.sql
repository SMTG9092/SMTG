-- ============================================
-- SMTG ERP
-- 002 - Companies and Users
-- ============================================

-- 1. Companies
CREATE TABLE IF NOT EXISTS platform.companies (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_code VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(250),
    tax_number VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    country VARCHAR(100) DEFAULT 'Morocco',
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'suspended', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Central user accounts
CREATE TABLE IF NOT EXISTS platform.users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password_hash TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('pending', 'active', 'blocked')),
    email_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Users linked to companies
CREATE TABLE IF NOT EXISTS platform.company_members (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id BIGINT NOT NULL
        REFERENCES platform.companies(id),
    user_id BIGINT NOT NULL
        REFERENCES platform.users(id),
    member_type VARCHAR(30) NOT NULL DEFAULT 'employee'
        CHECK (member_type IN ('company_admin', 'employee')),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('invited', 'active', 'suspended')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (company_id, user_id)
);

-- 4. Company departments
CREATE TABLE IF NOT EXISTS platform.company_departments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id BIGINT NOT NULL
        REFERENCES platform.companies(id),
    department_name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, department_name)
);

-- 5. Company roles
CREATE TABLE IF NOT EXISTS platform.company_roles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id BIGINT NOT NULL
        REFERENCES platform.companies(id),
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, role_name)
);

-- 6. Assign roles to company members
CREATE TABLE IF NOT EXISTS platform.company_user_roles (
    company_member_id BIGINT NOT NULL
        REFERENCES platform.company_members(id),
    company_role_id BIGINT NOT NULL
        REFERENCES platform.company_roles(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (company_member_id, company_role_id)
);

-- 7. Useful indexes
CREATE INDEX IF NOT EXISTS idx_company_members_user
    ON platform.company_members(user_id);

CREATE INDEX IF NOT EXISTS idx_company_departments_company
    ON platform.company_departments(company_id);

CREATE INDEX IF NOT EXISTS idx_company_roles_company
    ON platform.company_roles(company_id);

