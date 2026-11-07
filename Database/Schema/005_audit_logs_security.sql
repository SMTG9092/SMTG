
-- =====================================================
-- SMTG ERP
-- 005 - AUDIT LOGS & SECURITY
-- =====================================================

-- 1. AUDIT LOGS
-- Tracking important operations

CREATE TABLE IF NOT EXISTS platform.audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    actor_user_id BIGINT
        REFERENCES platform.users(id) ON DELETE SET NULL,

    actor_type VARCHAR(30) NOT NULL
        CHECK (actor_type IN ('platform', 'company', 'system')),

    company_id BIGINT
        REFERENCES platform.companies(id) ON DELETE SET NULL,

    action_code VARCHAR(100) NOT NULL,

    entity_type VARCHAR(100),
    entity_id VARCHAR(150),

    description TEXT,

    old_values JSONB,
    new_values JSONB,

    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(150),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
    ON platform.audit_logs(actor_user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_company
    ON platform.audit_logs(company_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
    ON platform.audit_logs(action_code);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
    ON platform.audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created
    ON platform.audit_logs(created_at DESC);


-- 2. USER SESSIONS
-- Active sessions and device tracking

CREATE TABLE IF NOT EXISTS platform.user_sessions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES platform.users(id) ON DELETE CASCADE,

    token_hash TEXT NOT NULL UNIQUE,

    device_name VARCHAR(200),
    device_type VARCHAR(50),

    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    expires_at TIMESTAMPTZ NOT NULL,

    revoked_at TIMESTAMPTZ,
    revoked_reason VARCHAR(200),

    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user
    ON platform.user_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expiry
    ON platform.user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_active
    ON platform.user_sessions(user_id, is_active);


-- 3. LOGIN ATTEMPTS
-- Successful and failed login attempts

CREATE TABLE IF NOT EXISTS platform.login_attempts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id BIGINT
        REFERENCES platform.users(id) ON DELETE SET NULL,

    email_attempted VARCHAR(255),

    ip_address INET,
    user_agent TEXT,

    attempt_status VARCHAR(20) NOT NULL
        CHECK (attempt_status IN ('success', 'failed', 'blocked')),

    failure_reason VARCHAR(200),

    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email
    ON platform.login_attempts(email_attempted);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip
    ON platform.login_attempts(ip_address);

CREATE INDEX IF NOT EXISTS idx_login_attempts_date
    ON platform.login_attempts(attempted_at DESC);


-- 4. SECURITY EVENTS
-- Important security incidents

CREATE TABLE IF NOT EXISTS platform.security_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id BIGINT
        REFERENCES platform.users(id) ON DELETE SET NULL,

    company_id BIGINT
        REFERENCES platform.companies(id) ON DELETE SET NULL,

    event_code VARCHAR(100) NOT NULL,

    severity VARCHAR(20) NOT NULL DEFAULT 'info'
        CHECK (severity IN ('info', 'warning', 'critical')),

    description TEXT,

    ip_address INET,
    metadata JSONB,

    status VARCHAR(20) NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'investigating', 'resolved', 'ignored')),

    resolved_by BIGINT
        REFERENCES platform.users(id) ON DELETE SET NULL,

    resolved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_user
    ON platform.security_events(user_id);

CREATE INDEX IF NOT EXISTS idx_security_events_company
    ON platform.security_events(company_id);

CREATE INDEX IF NOT EXISTS idx_security_events_severity
    ON platform.security_events(severity);

CREATE INDEX IF NOT EXISTS idx_security_events_status
    ON platform.security_events(status);

CREATE INDEX IF NOT EXISTS idx_security_events_created
    ON platform.security_events(created_at DESC);


-- =====================================================
-- END OF SMTG 005
-- =====================================================

