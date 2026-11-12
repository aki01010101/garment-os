# Graph Report - Garment POS  (2026-11-12)

## Corpus Check
- 85 files · ~178,620 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 552 nodes · 1885 edges · 25 communities (20 shown, 5 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 103 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e6980c48`
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
- types.ts
- package.json
- react
- dependencies
- compilerOptions
- vite.config.ts
- SaleTransaction
- scripts
- OfflineSyncIndicator.tsx
- vercel.json
- Garment OS - Retail Clothing POS & CRM
- Company
- motion@^12.23.24
- qrcode
- AppContextType
- react-is@^19.3.1
- recharts
- overrides

## God Nodes (most connected - your core abstractions)
1. `useApp()` - 90 edges
2. `react` - 65 edges
3. `lucide-react` - 62 edges
4. `AppContextType` - 40 edges
5. `printThermalReceiptHtml()` - 32 edges
6. `EscPosBuilder` - 31 edges
7. `ThermalReceipt()` - 30 edges
8. `AppProvider()` - 28 edges
9. `Customer` - 27 edges
10. `printViaWebBluetooth()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `thermalPrinterPlugin()` --calls--> `detectPrintersAndPorts()`  [EXTRACTED]
  vite.config.ts → src/server/printerBridge.js
- `thermalPrinterPlugin()` --calls--> `printRawToSerial()`  [EXTRACTED]
  vite.config.ts → src/server/printerBridge.js
- `thermalPrinterPlugin()` --calls--> `printRawToWindowsPrinter()`  [EXTRACTED]
  vite.config.ts → src/server/printerBridge.js
- `Navbar()` --calls--> `OfflineSyncIndicator()`  [EXTRACTED]
  src/components/Navbar.tsx → src/components/common/OfflineSyncIndicator.tsx
- `AppContextType` --references--> `AlterationRecord`  [EXTRACTED]
  src/context/AppContext.tsx → src/types.ts

## Import Cycles
- None detected.

## Communities (25 total, 5 thin omitted)

### Community 0 - "lucide-react"
Cohesion: 0.11
Nodes (39): App(), AppContent(), AlterationsManager(), CloudAuthModal(), LoginLockScreen(), BarcodeSvg(), BarcodeSvgProps, GarmentOsLogo() (+31 more)

### Community 1 - "react"
Cohesion: 0.10
Nodes (45): TailorTagPreviewModal(), DayRegisterManager(), EndOfDaySummaryModal(), EndOfDaySummaryModalProps, ZReportPreviewModal(), CustomerMeasurementModalProps, GARMENT_TYPES, PRESET_STANDARDS (+37 more)

### Community 2 - "escpos.ts"
Cohesion: 0.32
Nodes (9): ThermalReceipt(), EscPosBuilder, formatCreditNoteToEscPos(), formatCreditPaymentReceiptToEscPos(), formatCustomerKhataStatementToEscPos(), formatPriceTagsToEscPos(), formatSaleToEscPos(), formatTailorSlipToEscPos() (+1 more)

### Community 3 - "supabase.ts"
Cohesion: 0.09
Nodes (53): AppProvider(), asyncSyncAlteration(), asyncSyncCreditNote(), asyncSyncCustomer(), asyncSyncCustomerMeasurement(), asyncSyncDayRegister(), asyncSyncGiftVoucher(), asyncSyncProduct() (+45 more)

### Community 4 - "CustomerCRM.tsx"
Cohesion: 0.09
Nodes (44): ManagerPinOverrideModal(), ManagerPinOverrideModalProps, SignaturePadModal(), UpiPaymentQrProps, CelebrationEvent, CelebrationsManager(), CustomerCRM(), CustomerMeasurementModal (+36 more)

### Community 5 - "StockAuditModal.tsx"
Cohesion: 0.14
Nodes (6): ErrorBoundary, Props, State, activeStreams, installCameraGuardian(), stopAllCameraHardware()

### Community 6 - "AppContext.tsx"
Cohesion: 0.10
Nodes (32): AppContext, INITIAL_GIFT_VOUCHERS, safeLoad(), STORAGE_KEYS, DEFAULT_LOYALTY_CONFIG, DEFAULT_STORE_BRANCHES, DEFAULT_USERS, INITIAL_ALTERATIONS (+24 more)

### Community 7 - "types.ts"
Cohesion: 0.09
Nodes (22): GiftVouchersModalProps, PRESET_AMOUNTS, CATEGORIES, ALL_APP_TABS, AppTabDefinition, AuthState, CLOTHING_SIZE_GROUPS, CreditNoteItem (+14 more)

### Community 8 - "package.json"
Cohesion: 0.13
Nodes (21): devDependencies, autoprefixer@^10.4.21, tailwindcss@^4.3.3, tsx@^4.21.0, @types/express@^4.17.21, @types/node@^22.14.0, @types/react@^19.3.0, @types/react-dom@^19.3.0 (+13 more)

### Community 9 - "react"
Cohesion: 0.07
Nodes (53): lucide-react, react, CameraBarcodeScannerModal(), CameraBarcodeScannerModalProps, GoogleReviewQrProps, SignaturePadModalProps, WhatsAppLookbookModal(), BulkCsvImportModal() (+45 more)

### Community 10 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, dotenv@^17.2.3, express@^4.21.2, @google/genai@^2.4.0, html5-qrcode@^2.3.8, jsbarcode@^3.12.3, lucide-react@^0.546.0, react@^19.0.1 (+13 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+9 more)

### Community 12 - "vite.config.ts"
Cohesion: 0.18
Nodes (10): @tailwindcss/vite@^4.3.3, vite@^8.3.0, @vitejs/plugin-react@^6.1.1, @tailwindcss/vite, vite, @vitejs/plugin-react, detectPrintersAndPorts(), printRawToSerial() (+2 more)

### Community 13 - "SaleTransaction"
Cohesion: 0.23
Nodes (9): DigitalReceiptModalProps, ThermalReceiptProps, EditSaleModal(), EditSaleModalProps, PaymentMode, SaleItem, SaleTransaction, SplitPaymentBreakdown (+1 more)

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

### Community 18 - "Company"
Cohesion: 0.21
Nodes (10): AlterationNotifyModal(), AlterationNotifyModalProps, TailorTagPreviewModalProps, ZReportPreviewModalProps, ACCENT_COLOR_PRESETS, RETURN_POLICY_PRESETS, AlterationRecord, Company (+2 more)

### Community 21 - "AppContextType"
Cohesion: 0.14
Nodes (14): AppContextType, SupabaseConfig, AlterationDetails, BulkProductUpdate, CartItem, CashDrop, CloudUser, CouponCode (+6 more)

## Knowledge Gaps
- **4 isolated node(s):** `INITIAL_ALTERATIONS`, `INITIAL_COUPONS`, `INITIAL_CREDIT_NOTES`, `INITIAL_PROMOTIONS`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 111 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `lucide-react`, `react`, `CustomerCRM.tsx`, `StockAuditModal.tsx`, `AppContext.tsx`, `types.ts`, `package.json`, `dependencies`, `SaleTransaction`, `OfflineSyncIndicator.tsx`, `Company`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **What connects `INITIAL_ALTERATIONS`, `INITIAL_COUPONS`, `INITIAL_CREDIT_NOTES` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.11041229909154437 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `lucide-react`, `react`, `CustomerCRM.tsx`, `StockAuditModal.tsx`, `types.ts`, `package.json`, `dependencies`, `SaleTransaction`, `OfflineSyncIndicator.tsx`, `Company`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.09643483343074226 - nodes in this community are weakly interconnected._
- **Why does `useApp()` connect `lucide-react` to `react`, `escpos.ts`, `CustomerCRM.tsx`, `AppContext.tsx`, `types.ts`, `react`, `SaleTransaction`, `OfflineSyncIndicator.tsx`, `Company`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Should `supabase.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09415584415584416 - nodes in this community are weakly interconnected._