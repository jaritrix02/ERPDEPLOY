ALTER TABLE "costing_jobs"
ADD COLUMN "departmentType" TEXT NOT NULL DEFAULT 'RUBBER',
ADD COLUMN "purchaseOrderId" TEXT,
ADD COLUMN "purchaseOrderNo" TEXT,
ADD COLUMN "sourceItemId" TEXT,
ADD COLUMN "sourceItemCode" TEXT,
ADD COLUMN "sourceItemName" TEXT;
