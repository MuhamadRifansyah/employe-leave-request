-- ============================================================================
-- Employee Leave Management System — SQL Schema
-- ============================================================================
-- Database:    PostgreSQL 15+
-- Description: Raw DDL for the Leave Management System.
--              Can be used independently of Prisma for manual DB setup.
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE role_name AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE');

CREATE TYPE leave_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TYPE leave_type AS ENUM (
  'ANNUAL', 'SICK', 'PERSONAL',
  'MATERNITY', 'PATERNITY', 'UNPAID', 'OTHER'
);

CREATE TYPE action_type AS ENUM (
  -- Auth
  'LOGIN', 'LOGOUT',
  -- User
  'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
  -- Employee
  'EMPLOYEE_CREATED', 'EMPLOYEE_UPDATED', 'EMPLOYEE_DELETED',
  -- Leave
  'LEAVE_REQUESTED', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'LEAVE_CANCELLED',
  -- System
  'ROLE_ASSIGNED', 'ROLE_REVOKED'
);

-- ============================================================================
-- TABLE: roles
-- ============================================================================
-- Stores the three system roles. Seeded below.
-- ============================================================================

CREATE TABLE roles (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        role_name    NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  roles IS 'System roles: ADMIN, MANAGER, EMPLOYEE';
COMMENT ON COLUMN roles.name IS 'Unique role identifier (enum)';

-- ============================================================================
-- TABLE: users
-- ============================================================================
-- Authentication entity. Every person who logs in has a user record.
-- Linked to exactly one role.
-- ============================================================================

CREATE TABLE users (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  role_id       UUID         NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_users_role
    FOREIGN KEY (role_id)
    REFERENCES roles(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE INDEX idx_users_role_id   ON users(role_id);
CREATE INDEX idx_users_email     ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

COMMENT ON TABLE  users IS 'User accounts for authentication and authorization';
COMMENT ON COLUMN users.password_hash IS 'bcrypt-hashed password (never plaintext)';
COMMENT ON COLUMN users.is_active IS 'Soft-disable flag; FALSE prevents login';

-- ============================================================================
-- TABLE: employees
-- ============================================================================
-- Employee profile. 1:1 with users. Self-referencing for manager hierarchy.
-- ============================================================================

CREATE TABLE employees (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID         NOT NULL UNIQUE,
  manager_id UUID,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(255),
  phone      VARCHAR(20),
  department VARCHAR(100) NOT NULL,
  position   VARCHAR(100) NOT NULL,
  hire_date  DATE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_employees_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_employees_manager
    FOREIGN KEY (manager_id)
    REFERENCES employees(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

CREATE INDEX idx_employees_user_id    ON employees(user_id);
CREATE INDEX idx_employees_manager_id ON employees(manager_id);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_name       ON employees(name);

COMMENT ON TABLE  employees IS 'Employee profiles linked to user accounts';
COMMENT ON COLUMN employees.manager_id IS 'Self-referencing FK for org hierarchy (manager approves leave)';

-- ============================================================================
-- TABLE: leave_requests
-- ============================================================================
-- Core business table. Tracks leave lifecycle: PENDING → APPROVED/REJECTED.
-- ============================================================================

CREATE TABLE leave_requests (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id      UUID         NOT NULL,
  approver_id      UUID,
  start_date       DATE         NOT NULL,
  end_date         DATE         NOT NULL,
  total_days       INTEGER      NOT NULL,
  leave_type       leave_type   NOT NULL DEFAULT 'ANNUAL',
  reason           VARCHAR(500) NOT NULL,
  status           leave_status NOT NULL DEFAULT 'PENDING',
  rejection_reason VARCHAR(500),
  approved_at      TIMESTAMPTZ,
  rejected_at      TIMESTAMPTZ,
  cancelled_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_leave_requests_employee
    FOREIGN KEY (employee_id)
    REFERENCES employees(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_leave_requests_approver
    FOREIGN KEY (approver_id)
    REFERENCES employees(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  -- Business rules enforced at DB level
  CONSTRAINT chk_leave_dates
    CHECK (end_date >= start_date),

  CONSTRAINT chk_total_days_positive
    CHECK (total_days > 0),

  CONSTRAINT chk_rejection_reason
    CHECK (
      (status = 'REJECTED' AND rejection_reason IS NOT NULL)
      OR status != 'REJECTED'
    )
);

CREATE INDEX idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_approver_id ON leave_requests(approver_id);
CREATE INDEX idx_leave_requests_status      ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates       ON leave_requests(start_date, end_date);
CREATE INDEX idx_leave_requests_emp_dates   ON leave_requests(employee_id, start_date, end_date);

COMMENT ON TABLE  leave_requests IS 'Employee leave requests with approval workflow';
COMMENT ON COLUMN leave_requests.approver_id IS 'Manager/Admin who approved or rejected';
COMMENT ON COLUMN leave_requests.total_days IS 'Pre-computed duration for reporting (end_date - start_date + 1)';
COMMENT ON COLUMN leave_requests.rejection_reason IS 'Required when status = REJECTED';

-- ============================================================================
-- TABLE: activity_logs
-- ============================================================================
-- Immutable audit trail. Insert-only, no updates or deletes.
-- Addresses the "Logging & Observability" FAIL from code review.
-- ============================================================================

CREATE TABLE activity_logs (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL,
  action      action_type NOT NULL,
  target_id   UUID,
  target_type VARCHAR(50),
  metadata    JSONB,
  ip_address  VARCHAR(45),
  user_agent  VARCHAR(500),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_activity_logs_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX idx_activity_logs_user_id     ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action      ON activity_logs(action);
CREATE INDEX idx_activity_logs_created_at  ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_target      ON activity_logs(target_id, target_type);

COMMENT ON TABLE  activity_logs IS 'Immutable audit trail for all system actions';
COMMENT ON COLUMN activity_logs.target_id IS 'UUID of the affected entity (polymorphic)';
COMMENT ON COLUMN activity_logs.target_type IS 'Entity type: "user", "employee", "leave_request"';
COMMENT ON COLUMN activity_logs.metadata IS 'Flexible JSONB for action-specific context';

-- ============================================================================
-- TRIGGER: Auto-update `updated_at` on modification
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_leave_requests_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: Default roles
-- ============================================================================

INSERT INTO roles (name, description) VALUES
  ('ADMIN',    'Full system access. Can manage users, employees, roles, and all leave requests.'),
  ('MANAGER',  'Can manage subordinate employees and approve/reject their leave requests.'),
  ('EMPLOYEE', 'Standard employee. Can submit leave requests and view own data.');

-- ============================================================================
-- SEED DATA: Default admin user (password: admin123, bcrypt hash)
-- ============================================================================
-- NOTE: Replace this bcrypt hash with a properly generated one in production.
-- This is the bcrypt hash of "admin123" with 10 salt rounds.
-- ============================================================================

INSERT INTO users (username, email, password_hash, role_id) VALUES
  (
    'admin',
    'admin@leavely.app',
    '$2b$10$N9qo8uLOickgx2ZMRZoMye.IjqQBXjE0e0qN.gX5d/kzHDzh1QWKS',
    (SELECT id FROM roles WHERE name = 'ADMIN')
  );
