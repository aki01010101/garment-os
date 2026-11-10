# Graph Report - Garment POS  (2026-11-10)

## Corpus Check
- 70 files · ~146,028 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 460 nodes · 1563 edges · 22 communities (17 shown, 5 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 111 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a6a337c0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useApp
- escpos.ts
- supabase.ts
- CustomerCRM.tsx
- types.ts
- AppContext.tsx
- InventoryManager.tsx
- package.json
- CameraBarcodeScannerModal.tsx
- dependencies
- compilerOptions
- vite.config.ts
- CompanySettings.tsx
- scripts
- StockAuditModal.tsx
- vercel.json
- Garment OS - Retail Clothing POS & CRM
- motion@^12.23.24
- qrcode
- react-is@^19.3.1
- recharts
- overrides

## God Nodes (most connected - your core abstractions)
1. `useApp()` - 69 edges
2. `react` - 53 edges
3. `lucide-react` - 50 edges
4. `AppContextType` - 38 edges
5. `ThermalReceipt()` - 30 edges
6. `EscPosBuilder` - 30 edges
7. `printThermalReceiptHtml()` - 27 edges
8. `printViaWebBluetooth()` - 26 edges
9. `Customer` - 22 edges
10. `AppContent()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `EditSaleModalProps` --references--> `SaleTransaction`  [EXTRACTED]
  src/components/sales/EditSaleModal.tsx → src/types.ts
- `thermalPrinterPlugin()` --calls--> `detectPrintersAndPorts()`  [EXTRACTED]
  vite.config.ts → src/server/printerBridge.js
- `thermalPrinterPlugin()` --calls--> `printRawToSerial()`  [EXTRACTED]
  vite.config.ts → src/server/printerBridge.js
- `thermalPrinterPlugin()` --calls--> `printRawToWindowsPrinter()`  [EXTRACTED]
  vite.config.ts → src/server/printerBridge.js
- `ThermalReceipt()` --calls--> `SignaturePadModal()`  [EXTRACTED]
  src/components/pos/ThermalReceipt.tsx → src/components/common/SignaturePadModal.tsx

## Import Cycles
- None detected.

## Communities (22 total, 5 thin omitted)

### Community 0 - "useApp"
Cohesion: 0.08
Nodes (70): lucide-react, react, App(), AppContent(), AlterationNotifyModal(), AlterationsManager(), TailorTagPreviewModal(), LoginLockScreen() (+62 more)

### Community 2 - "escpos.ts"
Cohesion: 0.34
Nodes (9): ThermalReceipt(), EscPosBuilder, formatCreditNoteToEscPos(), formatCreditPaymentReceiptToEscPos(), formatCustomerKhataStatementToEscPos(), formatPriceTagsToEscPos(), formatSaleToEscPos(), formatTailorSlipToEscPos() (+1 more)

### Community 3 - "supabase.ts"
Cohesion: 0.11
Nodes (40): AppProvider(), safeLoad(), asyncSyncAlteration(), asyncSyncCreditNote(), asyncSyncCustomer(), asyncSyncDayRegister(), asyncSyncProduct(), asyncSyncPurchase() (+32 more)

### Community 4 - "CustomerCRM.tsx"
Cohesion: 0.10
Nodes (38): SignaturePadModal(), SignaturePadModalProps, CustomerCRM(), CustomerProfileModal(), CustomerProfileModalProps, RELATION_OPTIONS, SHIRT_SIZE_PRESETS, WAIST_SIZE_PRESETS (+30 more)

### Community 5 - "types.ts"
Cohesion: 0.15
Nodes (16): EditSaleModalProps, CATEGORIES, ALL_APP_TABS, AppTabDefinition, AuthState, ClothingCategory, CreditStatus, CustomerCreditPaymentAllocation (+8 more)

### Community 6 - "AppContext.tsx"
Cohesion: 0.09
Nodes (42): BarcodeSvgProps, AppContext, AppContextType, STORAGE_KEYS, DEFAULT_LOYALTY_CONFIG, DEFAULT_STORE_BRANCHES, DEFAULT_USERS, INITIAL_ALTERATIONS (+34 more)

### Community 7 - "InventoryManager.tsx"
Cohesion: 0.12
Nodes (26): BulkCsvImportModal(), BulkCsvImportModalProps, FIELD_ALIASES, FieldKey, matchHeaderToField(), parseCleanNumber(), parseCsvLine(), BulkUpdateModal() (+18 more)

### Community 8 - "package.json"
Cohesion: 0.13
Nodes (21): devDependencies, autoprefixer@^10.4.21, tailwindcss@^4.3.3, tsx@^4.21.0, @types/express@^4.17.21, @types/node@^22.14.0, @types/react@^19.3.0, @types/react-dom@^19.3.0 (+13 more)

### Community 9 - "CameraBarcodeScannerModal.tsx"
Cohesion: 0.11
Nodes (11): CameraBarcodeScannerModal(), CameraBarcodeScannerModalProps, ErrorBoundary, Props, State, CreditNoteItem, getAudioContext(), playScannerBeep() (+3 more)

### Community 10 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, dotenv@^17.2.3, express@^4.21.2, @google/genai@^2.4.0, html5-qrcode@^2.3.8, jsbarcode@^3.12.3, lucide-react@^0.546.0, react@^19.0.1 (+13 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+9 more)

### Community 12 - "vite.config.ts"
Cohesion: 0.18
Nodes (10): @tailwindcss/vite@^4.3.3, vite@^8.3.0, @vitejs/plugin-react@^6.1.1, @tailwindcss/vite, vite, @vitejs/plugin-react, detectPrintersAndPorts(), printRawToSerial() (+2 more)

### Community 13 - "CompanySettings.tsx"
Cohesion: 0.22
Nodes (9): AlterationNotifyModalProps, TailorTagPreviewModalProps, ZReportPreviewModalProps, ACCENT_COLOR_PRESETS, RETURN_POLICY_PRESETS, AlterationRecord, Company, CompanyType (+1 more)

### Community 14 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, clean, dev, lint, preview

### Community 15 - "StockAuditModal.tsx"
Cohesion: 0.43
Nodes (5): StockAuditModal(), StockAuditModalProps, StockAuditItem, StockAuditSession, playBarcodeBeep()

### Community 16 - "vercel.json"
Cohesion: 0.33
Nodes (5): buildCommand, framework, installCommand, rewrites, $schema

### Community 17 - "Garment OS - Retail Clothing POS & CRM"
Cohesion: 0.50
Nodes (3): 50mm Thermal Printer Settings, Complete Feature Suite, Garment OS - Retail Clothing POS & CRM

## Knowledge Gaps
- **4 isolated node(s):** `INITIAL_ALTERATIONS`, `INITIAL_COUPONS`, `INITIAL_CREDIT_NOTES`, `INITIAL_PROMOTIONS`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 88 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `useApp` to `CustomerCRM.tsx`, `types.ts`, `AppContext.tsx`, `InventoryManager.tsx`, `package.json`, `CameraBarcodeScannerModal.tsx`, `dependencies`, `CompanySettings.tsx`, `StockAuditModal.tsx`?**
  _High betweenness centrality (0.161) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `ThermalReceipt()` (e.g. with `.align()` and `.barcode128()`) actually correct?**
  _`ThermalReceipt()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `INITIAL_ALTERATIONS`, `INITIAL_COUPONS`, `INITIAL_CREDIT_NOTES` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useApp` be split into smaller, more focused modules?**
  _Cohesion score 0.08211997670355271 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `useApp` to `CustomerCRM.tsx`, `types.ts`, `InventoryManager.tsx`, `package.json`, `CameraBarcodeScannerModal.tsx`, `dependencies`, `CompanySettings.tsx`, `StockAuditModal.tsx`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Should `supabase.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11149825783972125 - nodes in this community are weakly interconnected._
- **Why does `useApp()` connect `useApp` to `escpos.ts`, `CustomerCRM.tsx`, `types.ts`, `AppContext.tsx`, `InventoryManager.tsx`, `CameraBarcodeScannerModal.tsx`, `CompanySettings.tsx`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._