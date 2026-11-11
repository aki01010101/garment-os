# Graph Report - Garment POS  (2026-11-11)

## Corpus Check
- 83 files · ~173,719 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 539 nodes · 1827 edges · 18 communities (17 shown, 1 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 114 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f5d52f7b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- lucide-react
- react
- escpos.ts
- supabase.ts
- CustomerCRM.tsx
- StockAuditModal.tsx
- AppContext.tsx
- CustomerDisplay.tsx
- package.json
- InventoryManager.tsx
- dependencies
- compilerOptions
- vite.config.ts
- @types/qrcode@^1.5.6
- scripts
- OfflineSyncIndicator.tsx
- vercel.json
- Garment OS - Retail Clothing POS & CRM

## God Nodes (most connected - your core abstractions)
1. `useApp()` - 88 edges
2. `react` - 64 edges
3. `lucide-react` - 61 edges
4. `AppContextType` - 39 edges
5. `printThermalReceiptHtml()` - 32 edges
6. `EscPosBuilder` - 31 edges
7. `ThermalReceipt()` - 30 edges
8. `Customer` - 27 edges
9. `printViaWebBluetooth()` - 26 edges
10. `Product` - 25 edges

## Surprising Connections (you probably didn't know these)
- `EditSaleModalProps` --references--> `SaleTransaction`  [EXTRACTED]
  src/components/sales/EditSaleModal.tsx → src/types.ts
- `StockTransferModalProps` --references--> `Product`  [EXTRACTED]
  src/components/inventory/StockTransferModal.tsx → src/types.ts
- `thermalPrinterPlugin()` --calls--> `detectPrintersAndPorts()`  [EXTRACTED]
  vite.config.ts → src/server/printerBridge.js
- `thermalPrinterPlugin()` --calls--> `printRawToSerial()`  [EXTRACTED]
  vite.config.ts → src/server/printerBridge.js
- `thermalPrinterPlugin()` --calls--> `printRawToWindowsPrinter()`  [EXTRACTED]
  vite.config.ts → src/server/printerBridge.js

## Import Cycles
- None detected.

## Communities (18 total, 1 thin omitted)

### Community 0 - "lucide-react"
Cohesion: 0.10
Nodes (35): lucide-react, App(), AppContent(), LoginLockScreen(), GarmentOsLogo(), GarmentOsLogoProps, GoogleReviewQr(), GoogleReviewQrProps (+27 more)

### Community 1 - "react"
Cohesion: 0.14
Nodes (37): jsbarcode, react, TailorTagPreviewModal(), DayRegisterManager(), EndOfDaySummaryModal(), EndOfDaySummaryModalProps, ZReportPreviewModal(), BarcodeSvg() (+29 more)

### Community 2 - "escpos.ts"
Cohesion: 0.30
Nodes (10): ThermalReceipt(), EscPosBuilder, formatCreditNoteToEscPos(), formatCreditPaymentReceiptToEscPos(), formatCustomerKhataStatementToEscPos(), formatPriceTagsToEscPos(), formatSaleToEscPos(), formatTailorSlipToEscPos() (+2 more)

### Community 3 - "supabase.ts"
Cohesion: 0.10
Nodes (45): AppProvider(), safeLoad(), asyncSyncAlteration(), asyncSyncCreditNote(), asyncSyncCustomer(), asyncSyncCustomerMeasurement(), asyncSyncDayRegister(), asyncSyncGiftVoucher() (+37 more)

### Community 4 - "CustomerCRM.tsx"
Cohesion: 0.08
Nodes (55): ManagerPinOverrideModal(), ManagerPinOverrideModalProps, SignaturePadModal(), CelebrationEvent, CelebrationsManager(), CustomerCRM(), CustomerMeasurementModal, CustomerMeasurementModalProps (+47 more)

### Community 5 - "StockAuditModal.tsx"
Cohesion: 0.08
Nodes (19): AlterationNotifyModal(), AlterationsManager(), CameraBarcodeScannerModal(), CameraBarcodeScannerModalProps, ErrorBoundary, Props, State, StockAuditModal() (+11 more)

### Community 6 - "AppContext.tsx"
Cohesion: 0.05
Nodes (77): AlterationNotifyModalProps, TailorTagPreviewModalProps, ZReportPreviewModalProps, ACCENT_COLOR_PRESETS, RETURN_POLICY_PRESETS, RestockPrediction, SmartRestockPredictorModalProps, StockTransferModalProps (+69 more)

### Community 7 - "CustomerDisplay.tsx"
Cohesion: 0.27
Nodes (10): qrcode@^1.5.4, qrcode, CustomerDisplay(), SLIDESHOW_ITEMS, CustomerDisplayPayload, broadcastCustomerDisplay(), getBroadcastChannel(), getCurrentCustomerDisplay() (+2 more)

### Community 8 - "package.json"
Cohesion: 0.11
Nodes (23): devDependencies, autoprefixer@^10.4.21, tailwindcss@^4.3.3, tsx@^4.21.0, @types/express@^4.17.21, @types/node@^22.14.0, @types/react@^19.3.0, @types/react-dom@^19.3.0 (+15 more)

### Community 9 - "InventoryManager.tsx"
Cohesion: 0.08
Nodes (39): BulkCsvImportModal(), BulkCsvImportModalProps, FIELD_ALIASES, FieldKey, matchHeaderToField(), parseCleanNumber(), parseCsvLine(), BulkUpdateModal() (+31 more)

### Community 10 - "dependencies"
Cohesion: 0.08
Nodes (24): dependencies, dotenv@^17.2.3, express@^4.21.2, @google/genai@^2.4.0, html5-qrcode@^2.3.8, jsbarcode@^3.12.3, lucide-react@^0.546.0, motion@^12.23.24 (+16 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+9 more)

### Community 12 - "vite.config.ts"
Cohesion: 0.18
Nodes (10): @tailwindcss/vite@^4.3.3, vite@^8.3.0, @vitejs/plugin-react@^6.1.1, @tailwindcss/vite, vite, @vitejs/plugin-react, detectPrintersAndPorts(), printRawToSerial() (+2 more)

### Community 14 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, clean, dev, lint, preview

### Community 15 - "OfflineSyncIndicator.tsx"
Cohesion: 0.50
Nodes (6): OfflineSyncIndicator(), clearOfflineOutbox(), getOfflineOutbox(), OfflineQueueItem, queueOfflineTransaction(), removeOfflineItem()

### Community 16 - "vercel.json"
Cohesion: 0.33
Nodes (5): buildCommand, framework, installCommand, rewrites, $schema

### Community 17 - "Garment OS - Retail Clothing POS & CRM"
Cohesion: 0.50
Nodes (3): 50mm Thermal Printer Settings, Complete Feature Suite, Garment OS - Retail Clothing POS & CRM

## Knowledge Gaps
- **4 isolated node(s):** `INITIAL_ALTERATIONS`, `INITIAL_COUPONS`, `INITIAL_CREDIT_NOTES`, `INITIAL_PROMOTIONS`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 109 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `lucide-react`, `CustomerCRM.tsx`, `StockAuditModal.tsx`, `AppContext.tsx`, `CustomerDisplay.tsx`, `package.json`, `InventoryManager.tsx`, `dependencies`, `OfflineSyncIndicator.tsx`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **What connects `INITIAL_ALTERATIONS`, `INITIAL_COUPONS`, `INITIAL_CREDIT_NOTES` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.09725490196078432 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `lucide-react` to `react`, `CustomerCRM.tsx`, `StockAuditModal.tsx`, `AppContext.tsx`, `CustomerDisplay.tsx`, `package.json`, `InventoryManager.tsx`, `dependencies`, `OfflineSyncIndicator.tsx`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.13650075414781296 - nodes in this community are weakly interconnected._
- **Why does `useApp()` connect `CustomerCRM.tsx` to `lucide-react`, `react`, `escpos.ts`, `StockAuditModal.tsx`, `AppContext.tsx`, `InventoryManager.tsx`, `OfflineSyncIndicator.tsx`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Should `supabase.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09663120567375887 - nodes in this community are weakly interconnected._