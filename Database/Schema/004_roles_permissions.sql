-- ============================================
-- SMTG ERP
-- 004 - Roles and Permissions
-- ============================================

-- 1. Permission catalog
CREATE TABLE platform.permissions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    permission_code VARCHAR(120) NOT NULL UNIQUE,
    permission_name VARCHAR(150) NOT NULL,

    permission_scope VARCHAR(20) NOT NULL
        CHECK (permission_scope IN ('platform', 'company')),

    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SMTG internal roles
CREATE TABLE platform.platform_roles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    role_code VARCHAR(80) NOT NULL UNIQUE,
    role_name VARCHAR(150) NOT NULL,

    description TEXT,

    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Assign internal roles to users
CREATE TABLE platform.platform_user_roles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES platform.users(id),

    role_id BIGINT NOT NULL
        REFERENCES platform.platform_roles(id),

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (user_id, role_id)
);

-- 4. Permissions assigned to SMTG roles
CREATE TABLE platform.platform_role_permissions (
    role_id BIGINT NOT NULL
        REFERENCES platform.platform_roles(id),

    permission_id BIGINT NOT NULL
        REFERENCES platform.permissions(id),

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (role_id, permission_id)
);

-- 5. Permissions assigned to company roles
CREATE TABLE platform.company_role_permissions (
    company_role_id BIGINT NOT NULL
        REFERENCES platform.company_roles(id),

    permission_id BIGINT NOT NULL
        REFERENCES platform.permissions(id),

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (company_role_id, permission_id)
);

-- ============================================
-- 6. Main SMTG Owner
-- Only one primary owner account
-- ============================================

CREATE TABLE platform.platform_owner (
    singleton_id SMALLINT PRIMARY KEY DEFAULT 1
        CHECK (singleton_id = 1),

    owner_user_id BIGINT NOT NULL UNIQUE
        REFERENCES platform.users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. Delegated Owner privileges
-- ============================================

CREATE TABLE platform.owner_delegations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    delegate_user_id BIGINT NOT NULL
        REFERENCES platform.users(id),

    granted_by_owner_id BIGINT NOT NULL
        REFERENCES platform.platform_owner(owner_user_id),

    delegation_status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (delegation_status IN (
            'active',
            'revoked',
            'expired'
        )),

    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    expires_at TIMESTAMPTZ,

    revoked_at TIMESTAMPTZ,

    delegation_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (
        expires_at IS NULL
        OR expires_at > granted_at
    )
);

CREATE INDEX idx_platform_user_roles_user
    ON platform.platform_user_roles(user_id);

CREATE INDEX idx_platform_user_roles_role
    ON platform.platform_user_roles(role_id);

CREATE INDEX idx_platform_role_permissions_permission
    ON platform.platform_role_permissions(permission_id);

CREATE INDEX idx_company_role_permissions_permission
    ON platform.company_role_permissions(permission_id);

CREATE INDEX idx_owner_delegations_user
    ON platform.owner_delegations(delegate_user_id);


-- ============================================
-- 8. Enforce company isolation in role assignment
-- ============================================

ALTER TABLE platform.company_members
ADD CONSTRAINT uq_company_member_company_id
UNIQUE (id, company_id);

ALTER TABLE platform.company_roles
ADD CONSTRAINT uq_company_role_company_id
UNIQUE (id, company_id);

ALTER TABLE platform.company_user_roles
ADD COLUMN company_id BIGINT;

UPDATE platform.company_user_roles cur
SET company_id = cm.company_id
FROM platform.company_members cm,
     platform.company_roles cr
WHERE cm.id = cur.company_member_id
  AND cr.id = cur.company_role_id
  AND cm.company_id = cr.company_id;

ALTER TABLE platform.company_user_roles
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE platform.company_user_roles
ADD CONSTRAINT fk_member_same_company
FOREIGN KEY (company_member_id, company_id)
REFERENCES platform.company_members(id, company_id);

ALTER TABLE platform.company_user_roles
ADD CONSTRAINT fk_role_same_company
FOREIGN KEY (company_role_id, company_id)
REFERENCES platform.company_roles(id, company_id);


-- ============================================
-- 9. Owner delegation protection
-- ============================================

CREATE UNIQUE INDEX uq_active_owner_delegation
ON platform.owner_delegations(delegate_user_id)
WHERE delegation_status = 'active';

CREATE INDEX idx_owner_delegations_expiry
ON platform.owner_delegations(expires_at)
WHERE delegation_status = 'active';

