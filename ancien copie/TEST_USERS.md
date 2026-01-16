# Test Users - BlackRaven OSINT Platform

## Admin Test Accounts

Three test accounts have been created with different roles and permissions:

### 1. Super Admin (Full Access)
- **Username:** `super_admin`
- **Email:** `super_admin@k3pr0s.local`
- **Password:** `TestPass123!`
- **Role:** `super_admin`
- **Access:**
  - OSINT / Dossiers Dashboard
  - Support / Tickets Dashboard
  - Admin Panel
  - Full system access

### 2. Admin (OSINT & Dossiers)
- **Username:** `admin`
- **Email:** `admin@k3pr0s.local`
- **Password:** `TestPass123!`
- **Role:** `admin`
- **Access:**
  - OSINT / Dossiers Dashboard
  - Admin Panel
  - Cannot access Support/Tickets

### 3. Support (Tickets & Client Relations)
- **Username:** `support`
- **Email:** `support@k3pr0s.local`
- **Password:** `TestPass123!`
- **Role:** `support`
- **Access:**
  - Support / Tickets Dashboard
  - Cannot access OSINT/Dossiers
  - Cannot access Admin Panel

## Features

### Navigation System
Each authenticated admin will see navigation buttons in the header based on their permissions:

1. **OSINT / DOSSIERS** (green) - For managing dossiers and OSINT operations
2. **SUPPORT / TICKETS** (blue) - For managing client tickets and GLPI integration
3. **ADMIN PANEL** (amber) - For managing users and admins

The active dashboard is highlighted with a colored background.

### Role-Based Access Control
- Users only see buttons for dashboards they have permission to access
- Each role has specific permissions defined in the database
- All permissions are enforced at both UI and database levels via RLS policies

## Testing Instructions

1. **Logout** from any current session
2. Close and reopen your browser (or do CTRL+F5)
3. Go to Admin Login
4. Test each account with their credentials
5. Verify that:
   - The correct role is displayed in the header
   - Only authorized navigation buttons are visible
   - Dashboard switching works correctly
   - Unauthorized pages cannot be accessed

## Security Notes

- These are TEST accounts for development only
- Remove or change passwords before production deployment
- All passwords are hashed in the database
- RLS policies enforce access control at the database level
