# NexusERP Import Templates

This directory contains standardized templates for importing data into various NexusERP modules. 

## Available Templates:

1. **Items Master:** [Items_Template.csv](./Items_Template.csv)
   - Columns: `itemCode`, `itemName`, `itemType` (RAW_MATERIAL, SEMI_FINISHED, FINISHED, CONSUMABLE), `unitOfMeasure`, `gstRate`, `openingStock`.

2. **Vendors Master:** [Vendors_Template.csv](./Vendors_Template.csv)
   - Columns: `vendorCode`, `name`, `email`, `phone`, `gstNumber`, `panNumber`, `address`, `city`, `state`, `pincode`.

3. **Employee Master:** [Employee_Template.csv](./Employee_Template.csv)
   - Columns: `empCode`, `name`, `email`, `department`, `designation`, `dateOfJoining`, `basicSalary`, `status`.

4. **Machine Master:** [Machine_Template.csv](./Machine_Template.csv)
   - Columns: `machineCode`, `name`, `location`, `installationDate`, `lastServiceDate`, `status`.

## Instructions:
- Always use the exact column headers provided in the templates.
- Ensure dates are in `YYYY-MM-DD` format.
- Save files as UTF-8 encoded CSV.
