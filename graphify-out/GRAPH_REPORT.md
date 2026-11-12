# Graph Report - Garment POS  (2026-11-12)

## Corpus Check
- 85 files · ~180,564 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 558 nodes · 1916 edges · 27 communities (21 shown, 6 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 104 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e6f37c70`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- escpos.ts
- supabase.ts
- escpos.ts
- getCloudUser
- CustomerCRM.tsx
- StockAuditModal.tsx
- AppContext.tsx
- AppProvider
- package.json
- InventoryManager.tsx
- dependencies
- compilerOptions
- vite.config.ts
- CustomerDisplay.tsx
- scripts
- OfflineSyncIndicator.tsx
- vercel.json
- Garment OS - Retail Clothing POS & CRM
- SettingsManager.tsx
- motion@^12.23.24
- dotenv@^17.2.3
- react-is@^19.3.1
- AlterationsManager.tsx
- overrides
- @vitejs/plugin-react
- GiftVouchersModal.tsx
- qrcode

## God Nodes (most connected - your core abstractions)
1. `useApp()` - 90 edges
2. `react` - 65 edges
3. `lucide-react` - 62 edges
4. `AppContextType` - 40 edges
5. `AppProvider()` - 32 edges
6. `printThermalReceiptHtml()` - 32 edges
7. `EscPosBuilder` - 31 edges
8. `ThermalReceipt()` - 30 edges
9. `Customer` - 27 edges
10. `printViaWebBluetooth()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `thermalPrinterPlugin()` --calls--> `detectPrintersAndPorts()`  [EXTRACTED]
  vite.config.ts → src/server/printerBridge.js
- `thermalPrinterPlugin()` --calls--> `printRawToSerial()`  [EXTRACTED]
  vite.config.ts → src/server/printerBridge.js
- `thermalPrinterPlugin()` --calls--> `printRawToWindowsPrinter()`  [EXTRACTED]
  vite.config.ts → src/server/printerBridge.js
- `AppContextType` --references--> `AlterationRecord`  [EXTRACTED]
  src/context/AppContext.tsx → src/types.ts
- `AppContextType` --references--> `BulkCsvImportRow`  [EXTRACTED]
  src/context/AppContext.tsx → src/types.ts

## Import Cycles
- None detected.

## Communities (27 total, 6 thin omitted)

### Community 0 - "escpos.ts"
Cohesion: 0.09
Nodes (51): jsbarcode, TailorTagPreviewModal(), DayRegisterManager(), EndOfDaySummaryModal(), EndOfDaySummaryModalProps, ZReportPreviewModal(), BarcodeSvg(), BarcodeSvgProps (+43 more)

### Community 1 - "supabase.ts"
Cohesion: 0.16
Nodes (18): asyncSyncCustomerMeasurement(), DEFAULT_SUPABASE_ANON_KEY, DEFAULT_SUPABASE_URL, mapAlterationFromDb(), mapCompanyFromDb(), mapCreditNoteFromDb(), mapCustomerFromDb(), mapCustomerMeasurementToDb() (+10 more)

### Community 2 - "escpos.ts"
Cohesion: 0.29
Nodes (11): ThermalReceipt(), EscPosBuilder, formatCreditNoteToEscPos(), formatCreditPaymentReceiptToEscPos(), formatCustomerKhataStatementToEscPos(), formatPriceTagsToEscPos(), formatSaleToEscPos(), formatTailorSlipToEscPos() (+3 more)

### Community 3 - "getCloudUser"
Cohesion: 0.13
Nodes (28): asyncSyncAlteration(), asyncSyncCompany(), asyncSyncCreditNote(), asyncSyncCustomer(), asyncSyncDayRegister(), asyncSyncGiftVoucher(), asyncSyncProduct(), asyncSyncPromotion() (+20 more)

### Community 4 - "CustomerCRM.tsx"
Cohesion: 0.07
Nodes (69): lucide-react, react, App(), AppContent(), CloudAuthModal(), LoginLockScreen(), GarmentOsLogo(), GarmentOsLogoProps (+61 more)

### Community 5 - "StockAuditModal.tsx"
Cohesion: 0.12
Nodes (9): CameraBarcodeScannerModalProps, ErrorBoundary, Props, State, getAudioContext(), playScannerBeep(), activeStreams, installCameraGuardian() (+1 more)

### Community 6 - "AppContext.tsx"
Cohesion: 0.08
Nodes (47): ZReportPreviewModalProps, AppContext, AppContextType, INITIAL_GIFT_VOUCHERS, STORAGE_KEYS, DEFAULT_LOYALTY_CONFIG, DEFAULT_STORE_BRANCHES, DEFAULT_USERS (+39 more)

### Community 7 - "AppProvider"
Cohesion: 0.23
Nodes (15): AppProvider(), safeLoad(), asyncSyncDeletePromotion(), clearSupabaseCredentials(), displayAuthIdentifier(), getCloudSession(), getSupabase(), getSupabaseConfig() (+7 more)

### Community 8 - "package.json"
Cohesion: 0.13
Nodes (21): devDependencies, autoprefixer@^10.4.21, tailwindcss@^4.3.3, tsx@^4.21.0, @types/express@^4.17.21, @types/node@^22.14.0, @types/react@^19.3.0, @types/react-dom@^19.3.0 (+13 more)

### Community 9 - "InventoryManager.tsx"
Cohesion: 0.06
Nodes (64): CameraBarcodeScannerModal(), BulkCsvImportModal(), BulkCsvImportModalProps, FIELD_ALIASES, FieldKey, matchHeaderToField(), parseCleanNumber(), parseCsvLine() (+56 more)

### Community 10 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, express@^4.21.2, @google/genai@^2.4.0, html5-qrcode@^2.3.8, jsbarcode@^3.12.3, lucide-react@^0.546.0, react@^19.0.1, react-dom@^19.0.1 (+12 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+9 more)

### Community 12 - "vite.config.ts"
Cohesion: 0.22
Nodes (8): @tailwindcss/vite@^4.3.3, vite@^8.3.0, @tailwindcss/vite, vite, detectPrintersAndPorts(), printRawToSerial(), printRawToWindowsPrinter(), thermalPrinterPlugin()

### Community 13 - "CustomerDisplay.tsx"
Cohesion: 0.36
Nodes (8): CustomerDisplay(), SLIDESHOW_ITEMS, CustomerDisplayPayload, broadcastCustomerDisplay(), getBroadcastChannel(), getCurrentCustomerDisplay(), listenCustomerDisplay(), openCustomerDisplayWindow()

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

### Community 18 - "SettingsManager.tsx"
Cohesion: 0.18
Nodes (14): GoogleReviewQr(), GoogleReviewQrProps, ACCENT_COLOR_PRESETS, CompanySettings(), RETURN_POLICY_PRESETS, PrinterGuideModal(), PrinterGuideModalProps, PromotionsManager() (+6 more)

### Community 23 - "AlterationsManager.tsx"
Cohesion: 0.43
Nodes (6): AlterationNotifyModal(), AlterationNotifyModalProps, AlterationsManager(), TailorTagPreviewModalProps, AlterationRecord, Company

### Community 26 - "GiftVouchersModal.tsx"
Cohesion: 0.50
Nodes (3): GiftVouchersModalProps, PRESET_AMOUNTS, GiftVoucher

## Knowledge Gaps
- **4 isolated node(s):** `INITIAL_ALTERATIONS`, `INITIAL_COUPONS`, `INITIAL_CREDIT_NOTES`, `INITIAL_PROMOTIONS`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 111 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `CustomerCRM.tsx` to `escpos.ts`, `StockAuditModal.tsx`, `AppContext.tsx`, `package.json`, `InventoryManager.tsx`, `dependencies`, `CustomerDisplay.tsx`, `OfflineSyncIndicator.tsx`, `SettingsManager.tsx`, `AlterationsManager.tsx`, `GiftVouchersModal.tsx`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **What connects `INITIAL_ALTERATIONS`, `INITIAL_COUPONS`, `INITIAL_CREDIT_NOTES` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `escpos.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09230769230769231 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `CustomerCRM.tsx` to `escpos.ts`, `StockAuditModal.tsx`, `package.json`, `InventoryManager.tsx`, `dependencies`, `CustomerDisplay.tsx`, `OfflineSyncIndicator.tsx`, `SettingsManager.tsx`, `AlterationsManager.tsx`, `GiftVouchersModal.tsx`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Should `getCloudUser` be split into smaller, more focused modules?**
  _Cohesion score 0.13227513227513227 - nodes in this community are weakly interconnected._
- **Why does `useApp()` connect `CustomerCRM.tsx` to `escpos.ts`, `escpos.ts`, `AppContext.tsx`, `InventoryManager.tsx`, `OfflineSyncIndicator.tsx`, `SettingsManager.tsx`, `AlterationsManager.tsx`, `GiftVouchersModal.tsx`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `CustomerCRM.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06900904691773617 - nodes in this community are weakly interconnected._