# NexusERP Project Map

## Repository Layout
- `nexuserp/client`: React + Vite frontend.
- `nexuserp/server`: Express + Prisma backend.
- `nexuserp/server/prisma`: schema, migrations, and seed scripts.

## Frontend Ownership Map
- `client/src/App.jsx`: route tree + permission-based `ProtectedRoute`.
- `client/src/store/slices/authSlice.js`: login, token persistence, current user bootstrap.
- `client/src/services/api.js`: axios base client, token injection, unauthorized handling.
- `client/src/pages/auth`: login and auth screens.
- `client/src/pages/hr`: HR operations (employees, attendance, salary, advances, gate pass).
- `client/src/pages/purchase`: indent -> PO -> gate pass -> GRN -> MRN -> billing/returns.
- `client/src/pages/inventory`: stores, products, movement visibility.
- `client/src/pages/manufacturing`: BOM, work orders, material issue, output, conversion.
- `client/src/pages/qc`: incoming/process/final quality pages and parameters.
- `client/src/pages/maintenance`: machines and breakdown reporting.

## Backend Ownership Map
- `server/src/index.js`: app bootstrap, middleware, route mounting, socket server.
- `server/src/middleware/auth.js`: JWT protection, admin gate, module permission checks.
- `server/src/controllers`: business logic handlers for HR/manufacturing/items/users.
- `server/src/routes`: module APIs grouped by domain.
- `server/prisma/schema.prisma`: all data contracts, enums, and relations.

## Main Workflow Ownership
1. Auth/login
   - Frontend: `pages/auth/Login.jsx` -> `authSlice.js`
   - Backend: `routes/auth.js` -> `controllers/authController.js` -> `middleware/auth.js`
2. Purchase to inventory
   - `routes/indents.js` / `controllers/indentsController.js`
   - `routes/purchaseOrders.js`
   - `routes/gatePass.js`
   - `routes/grn.js`
   - `routes/mrn.js`
3. Manufacturing
   - `routes/workOrders.js` -> `controllers/manufacturingController.js`
4. HR/payroll
   - `routes/attendance.js`, `routes/salary.js` -> `controllers/salaryController.js`
5. QC and maintenance
   - `routes/qc.js`, `routes/qcParameters.js`
   - `routes/machines.js`, `routes/breakdowns.js`
