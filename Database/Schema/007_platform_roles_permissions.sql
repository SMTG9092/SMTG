
-- =====================================================
-- SMTG ERP
-- 007 - PLATFORM ROLES & PERMISSIONS
-- =====================================================

-- 1. PLATFORM ROLES

INSERT INTO platform.platform_roles
    (role_code, role_name, description, is_system_role, is_active)
VALUES
    ('OWNER', 'Primary Owner',
     'Primary owner with exclusive platform ownership powers',
     TRUE, TRUE),

    ('DELEGATED_OWNER', 'Delegated Owner',
     'Owner privileges delegated by the Primary Owner',
     TRUE, TRUE),

    ('SUPER_ADMIN', 'Super Admin',
     'General platform administration',
     TRUE, TRUE),

    ('COMMERCIAL', 'Commercial',
     'Company acquisition and commercial contract management',
     TRUE, TRUE),

    ('FINANCE', 'Finance',
     'Financial operations and payment verification',
     TRUE, TRUE),

    ('SUPPORT', 'Support',
     'Customer support and ticket management',
     TRUE, TRUE),

    ('TECHNICIAN', 'Technician',
     'Technical assistance and troubleshooting',
     TRUE, TRUE)

ON CONFLICT (role_code) DO UPDATE SET
    role_name = EXCLUDED.role_name,
    description = EXCLUDED.description,
    is_system_role = TRUE,
    is_active = TRUE;


-- 2. PLATFORM PERMISSIONS

INSERT INTO platform.permissions
    (permission_code, permission_name, permission_scope, description)
VALUES

-- Platform dashboard
('platform.dashboard.view', 'View platform dashboard',
 'platform', 'Access platform dashboard'),

-- Companies
('companies.view', 'View companies',
 'platform', 'View registered companies'),

('companies.create', 'Create companies',
 'platform', 'Register new companies'),

('companies.update', 'Update companies',
 'platform', 'Modify company information'),

('companies.suspend', 'Suspend companies',
 'platform', 'Suspend company access'),

('companies.activate', 'Activate companies',
 'platform', 'Activate company access'),

-- Contracts
('contracts.view', 'View contracts',
 'platform', 'View company contracts'),

('contracts.create', 'Create contracts',
 'platform', 'Create new company contracts'),

('contracts.update', 'Update contracts',
 'platform', 'Modify contract information'),

-- Pricing
('pricing.view', 'View pricing',
 'platform', 'View platform pricing catalog'),

('pricing.manage', 'Manage pricing',
 'platform', 'Create and modify pricing catalog'),

-- Subscriptions
('subscriptions.view', 'View subscriptions',
 'platform', 'View company subscriptions'),

('subscriptions.activate', 'Activate subscriptions',
 'platform', 'Activate company subscriptions'),

('subscriptions.suspend', 'Suspend subscriptions',
 'platform', 'Suspend company subscriptions'),

('subscriptions.renew', 'Renew subscriptions',
 'platform', 'Renew company subscriptions'),

-- Payments
('payments.view', 'View payments',
 'platform', 'View payment records'),

('payments.verify', 'Verify payments',
 'platform', 'Verify manual payments'),

('payments.refund', 'Manage refunds',
 'platform', 'Process authorized refunds'),

-- Users
('platform_users.view', 'View platform users',
 'platform', 'View internal SMTG users'),

('platform_users.create', 'Create platform users',
 'platform', 'Create internal SMTG users'),

('platform_users.update', 'Update platform users',
 'platform', 'Update internal SMTG users'),

('platform_users.block', 'Block platform users',
 'platform', 'Block internal SMTG users'),

-- Staff assignments
('staff_assignments.view', 'View staff assignments',
 'platform', 'View company assignments'),

('staff_assignments.manage', 'Manage staff assignments',
 'platform', 'Assign SMTG staff to companies'),

-- Support
('support.view', 'View support tickets',
 'platform', 'View assigned support tickets'),

('support.manage', 'Manage support tickets',
 'platform', 'Manage assigned support tickets'),

-- Technical
('technical.view', 'View technical tickets',
 'platform', 'View assigned technical tickets'),

('technical.manage', 'Manage technical tickets',
 'platform', 'Manage assigned technical tickets'),

-- Reports
('reports.view', 'View platform reports',
 'platform', 'View authorized platform reports'),

-- Audit and security
('audit.view', 'View audit logs',
 'platform', 'View authorized audit logs'),

('security.view', 'View security events',
 'platform', 'View security events'),

-- Roles
('roles.view', 'View platform roles',
 'platform', 'View platform roles'),

('roles.manage', 'Manage platform roles',
 'platform', 'Manage authorized platform roles'),

-- Owner exclusive operations
('owner.manage_delegations', 'Manage owner delegations',
 'platform', 'Grant and revoke delegated owner privileges'),

('owner.manage_subscriptions', 'Manage all subscriptions',
 'platform', 'Exclusive owner subscription control'),

('owner.free_activation', 'Activate companies for free',
 'platform', 'Activate any company free or for a limited period'),

('owner.lifetime_activation', 'Lifetime activation',
 'platform', 'Grant lifetime company activation'),

('owner.manage_contract_limits', 'Manage contract limits',
 'platform', 'Change company contract limits'),

('owner.transfer_primary', 'Transfer primary ownership',
 'platform', 'Exclusive primary ownership transfer'),

('owner.audit_all', 'View all platform audit records',
 'platform', 'View complete platform audit history')

ON CONFLICT (permission_code) DO NOTHING;


-- 3. ASSIGN PERMISSIONS TO ROLES

-- OWNER: All platform permissions
INSERT INTO platform.platform_role_permissions
    (role_id, permission_id)
SELECT r.id, p.id
FROM platform.platform_roles r
CROSS JOIN platform.permissions p
WHERE r.role_code = 'OWNER'
  AND p.permission_scope = 'platform'
ON CONFLICT DO NOTHING;


-- DELEGATED OWNER: Operational permissions
-- Does not receive primary ownership transfer
-- or delegation management permissions.

INSERT INTO platform.platform_role_permissions
    (role_id, permission_id)
SELECT r.id, p.id
FROM platform.platform_roles r
JOIN platform.permissions p
  ON p.permission_code IN (
      'platform.dashboard.view',
      'companies.view',
      'companies.create',
      'companies.update',
      'companies.suspend',
      'companies.activate',
      'contracts.view',
      'contracts.create',
      'contracts.update',
      'pricing.view',
      'pricing.manage',
      'subscriptions.view',
      'subscriptions.activate',
      'subscriptions.suspend',
      'subscriptions.renew',
      'payments.view',
      'payments.verify',
      'platform_users.view',
      'platform_users.create',
      'platform_users.update',
      'platform_users.block',
      'staff_assignments.view',
      'staff_assignments.manage',
      'support.view',
      'support.manage',
      'technical.view',
      'technical.manage',
      'reports.view',
      'audit.view',
      'security.view',
      'roles.view',
      'owner.manage_subscriptions',
      'owner.free_activation',
      'owner.lifetime_activation',
      'owner.manage_contract_limits',
      'owner.audit_all'
  )
WHERE r.role_code = 'DELEGATED_OWNER'
ON CONFLICT DO NOTHING;


-- SUPER ADMIN

INSERT INTO platform.platform_role_permissions
    (role_id, permission_id)
SELECT r.id, p.id
FROM platform.platform_roles r
JOIN platform.permissions p
  ON p.permission_code IN (
      'platform.dashboard.view',
      'companies.view',
      'companies.create',
      'companies.update',
      'contracts.view',
      'contracts.create',
      'contracts.update',
      'pricing.view',
      'subscriptions.view',
      'payments.view',
      'platform_users.view',
      'platform_users.create',
      'platform_users.update',
      'staff_assignments.view',
      'staff_assignments.manage',
      'support.view',
      'support.manage',
      'technical.view',
      'technical.manage',
      'reports.view',
      'audit.view',
      'security.view',
      'roles.view'
  )
WHERE r.role_code = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;


-- COMMERCIAL

INSERT INTO platform.platform_role_permissions
    (role_id, permission_id)
SELECT r.id, p.id
FROM platform.platform_roles r
JOIN platform.permissions p
  ON p.permission_code IN (
      'companies.view',
      'companies.create',
      'contracts.view',
      'contracts.create',
      'contracts.update',
      'pricing.view',
      'subscriptions.view',
      'reports.view'
  )
WHERE r.role_code = 'COMMERCIAL'
ON CONFLICT DO NOTHING;


-- FINANCE

INSERT INTO platform.platform_role_permissions
    (role_id, permission_id)
SELECT r.id, p.id
FROM platform.platform_roles r
JOIN platform.permissions p
  ON p.permission_code IN (
      'companies.view',
      'contracts.view',
      'subscriptions.view',
      'payments.view',
      'payments.verify',
      'payments.refund',
      'reports.view'
  )
WHERE r.role_code = 'FINANCE'
ON CONFLICT DO NOTHING;


-- SUPPORT

INSERT INTO platform.platform_role_permissions
    (role_id, permission_id)
SELECT r.id, p.id
FROM platform.platform_roles r
JOIN platform.permissions p
  ON p.permission_code IN (
      'companies.view',
      'platform_users.view',
      'support.view',
      'support.manage'
  )
WHERE r.role_code = 'SUPPORT'
ON CONFLICT DO NOTHING;


-- TECHNICIAN

INSERT INTO platform.platform_role_permissions
    (role_id, permission_id)
SELECT r.id, p.id
FROM platform.platform_roles r
JOIN platform.permissions p
  ON p.permission_code IN (
      'companies.view',
      'technical.view',
      'technical.manage'
  )
WHERE r.role_code = 'TECHNICIAN'
ON CONFLICT DO NOTHING;


-- =====================================================
-- END OF SMTG 007
-- =====================================================

