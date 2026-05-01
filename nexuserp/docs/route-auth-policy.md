# Route Authentication Policy

## Baseline
- All non-auth API modules must require authenticated users via `protect`.
- Module-level authorization is handled by frontend route/module permissions plus backend `checkPermission` where needed.

## Enforced in this pass
- `server/src/routes/salary.js`: protected payroll endpoints.
- `server/src/routes/qcParameters.js`: protected QC parameter CRUD.
- `server/src/routes/machines.js`: protected machine master endpoints.
- `server/src/routes/breakdowns.js`: protected breakdown reporting endpoints.

## Existing higher-privilege checks already present
- `server/src/routes/users.js`: `adminOnly` for write/delete user management.
- `server/src/routes/vendors.js`, `departments.js`, `items.js`, `units.js`: admin-only deletes.

## Follow-up recommendation
- Add `checkPermission` per route action in sensitive modules (payroll, admin, approvals) for strict backend RBAC parity with frontend modules.
