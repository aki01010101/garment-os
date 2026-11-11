# Graph Report - Garment POS  (2026-11-11)

## Corpus Check
- 82 files · ~171,861 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 533 nodes · 1811 edges · 26 communities (20 shown, 6 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 114 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `923bc4c8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useApp
- AppContextType
- escpos.ts
- supabase.ts
- CustomerCRM.tsx
- types.ts
- AppContext.tsx
- CustomerDisplay.tsx
- package.json
- InventoryManager.tsx
- dependencies
- compilerOptions
- vite.config.ts
- CompanySettings.tsx
- scripts
- OfflineSyncIndicator.tsx
- vercel.json
- Garment OS - Retail Clothing POS & CRM
- motion@^12.23.24
- dotenv@^17.2.3
- react-is@^19.3.1
- jsbarcode
- overrides
- @vitejs/plugin-react
- EditSaleModal.tsx
- SmartRestockPredictorModal.tsx

## God Nodes (most connected - your core abstractions)
1. `useApp()` - 88 edges
2. `react` - 63 edges
3. `lucide-react` - 60 edges
4. `AppContextType` - 39 edges
5. `printThermalReceiptHtml()` - 32 edges
6. `EscPosBuilder` - 31 edges
7. `ThermalReceipt()` - 30 edges
8. `Customer` - 27 edges
9. `printViaWebBluetooth()` - 26 edges
10. `Product` - 25 edges

## Surprising Connections (you probably didn't know these)
- `ThermalReceiptProps` --references--> `SaleTransaction`  [EXTRACTED]
  src/components/pos/ThermalReceipt.tsx → src/types.ts
- `StockTransferModalProps` --references--> `Product`  [EXTRACTED]
  src/components/inventory/StockTransferModal.tsx → src/types.ts
- `EditSaleModalProps` --references--> `SaleTransaction`  [EXTRACTED]
  src/components/sales/EditSaleModal.tsx → src/types.ts
- `thermalPrinterPlugin()` --calls--> `detectPrintersAndPorts()`  [EXTRACTED]
  vite.config.ts → src/server/printerBridge.js
- `thermalPrinterPlugin()` --calls--> `printRawToSerial()`  [EXTRACTED]
  vite.config.ts → src/server/printerBridge.js

## Import Cycles
- None detected.

## Communities (26 total, 6 thin omitted)

### Community 0 - "useApp"
Cohesion: 0.09
Nodes (61): lucide-react, react, App(), AppContent(), AlterationNotifyModal(), AlterationsManager(), TailorTagPreviewModal(), LoginLockScreen() (+53 more)

### Community 1 - "AppContextType"
Cohesion: 0.13
Nodes (15): BarcodeSvgProps, AppContextType, SupabaseConfig, AlterationDetails, AssociateCommissionPayout, BulkProductUpdate, CartItem, CashDrop (+7 more)

### Community 2 - "escpos.ts"
Cohesion: 0.16
Nodes (24): ThermalReceipt(), ThermalReceiptProps, KhataLedgerEntry, QR_SIZE_PIXELS, disconnectBluetoothPrinter(), disconnectUsbPrinter(), EscPosBuilder, EscPosOptions (+16 more)

### Community 3 - "supabase.ts"
Cohesion: 0.10
Nodes (44): AppProvider(), asyncSyncAlteration(), asyncSyncCreditNote(), asyncSyncCustomer(), asyncSyncCustomerMeasurement(), asyncSyncDayRegister(), asyncSyncGiftVoucher(), asyncSyncProduct() (+36 more)

### Community 4 - "CustomerCRM.tsx"
Cohesion: 0.07
Nodes (55): qrcode, ManagerPinOverrideModal(), ManagerPinOverrideModalProps, SignaturePadModal(), SignaturePadModalProps, UpiPaymentQr(), UpiPaymentQrProps, CelebrationEvent (+47 more)

### Community 5 - "types.ts"
Cohesion: 0.11
Nodes (20): StockTransferModalProps, CATEGORIES, ALL_APP_TABS, AppTabDefinition, AuthState, CreditNoteItem, CreditStatus, CustomerCreditPaymentAllocation (+12 more)

### Community 6 - "AppContext.tsx"
Cohesion: 0.11
Nodes (30): AppContext, INITIAL_GIFT_VOUCHERS, safeLoad(), STORAGE_KEYS, DEFAULT_LOYALTY_CONFIG, DEFAULT_STORE_BRANCHES, DEFAULT_USERS, INITIAL_ALTERATIONS (+22 more)

### Community 7 - "CustomerDisplay.tsx"
Cohesion: 0.36
Nodes (8): CustomerDisplay(), SLIDESHOW_ITEMS, CustomerDisplayPayload, broadcastCustomerDisplay(), getBroadcastChannel(), getCurrentCustomerDisplay(), listenCustomerDisplay(), openCustomerDisplayWindow()

### Community 8 - "package.json"
Cohesion: 0.13
Nodes (21): devDependencies, autoprefixer@^10.4.21, tailwindcss@^4.3.3, tsx@^4.21.0, @types/express@^4.17.21, @types/node@^22.14.0, @types/react@^19.3.0, @types/react-dom@^19.3.0 (+13 more)

### Community 9 - "InventoryManager.tsx"
Cohesion: 0.06
Nodes (44): CameraBarcodeScannerModal(), CameraBarcodeScannerModalProps, ErrorBoundary, Props, State, BulkCsvImportModal(), BulkCsvImportModalProps, FIELD_ALIASES (+36 more)

### Community 10 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, express@^4.21.2, @google/genai@^2.4.0, html5-qrcode@^2.3.8, lucide-react@^0.546.0, qrcode@^1.5.4, react@^19.0.1, react-dom@^19.0.1 (+12 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+9 more)

### Community 12 - "vite.config.ts"
Cohesion: 0.22
Nodes (8): @tailwindcss/vite@^4.3.3, vite@^8.3.0, @tailwindcss/vite, vite, detectPrintersAndPorts(), printRawToSerial(), printRawToWindowsPrinter(), thermalPrinterPlugin()

### Community 13 - "CompanySettings.tsx"
Cohesion: 0.22
Nodes (9): AlterationNotifyModalProps, TailorTagPreviewModalProps, ZReportPreviewModalProps, ACCENT_COLOR_PRESETS, RETURN_POLICY_PRESETS, AlterationRecord, Company, CompanyType (+1 more)

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

### Community 24 - "EditSaleModal.tsx"
Cohesion: 0.32
Nodes (6): EditSaleModal(), EditSaleModalProps, SalesRegister(), PaymentMode, SaleItem, SplitPaymentBreakdown

### Community 25 - "SmartRestockPredictorModal.tsx"
Cohesion: 0.50
Nodes (4): RestockPrediction, SmartRestockPredictorModalProps, PurchaseOrder, Vendor

## Knowledge Gaps
- **4 isolated node(s):** `INITIAL_ALTERATIONS`, `INITIAL_COUPONS`, `INITIAL_CREDIT_NOTES`, `INITIAL_PROMOTIONS`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 106 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `useApp` to `escpos.ts`, `CustomerCRM.tsx`, `types.ts`, `AppContext.tsx`, `CustomerDisplay.tsx`, `package.json`, `InventoryManager.tsx`, `dependencies`, `CompanySettings.tsx`, `OfflineSyncIndicator.tsx`, `EditSaleModal.tsx`, `SmartRestockPredictorModal.tsx`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **What connects `INITIAL_ALTERATIONS`, `INITIAL_COUPONS`, `INITIAL_CREDIT_NOTES` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useApp` be split into smaller, more focused modules?**
  _Cohesion score 0.09077878643096035 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `useApp` to `escpos.ts`, `CustomerCRM.tsx`, `types.ts`, `CustomerDisplay.tsx`, `package.json`, `InventoryManager.tsx`, `dependencies`, `CompanySettings.tsx`, `OfflineSyncIndicator.tsx`, `EditSaleModal.tsx`, `SmartRestockPredictorModal.tsx`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Should `AppContextType` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Why does `useApp()` connect `useApp` to `escpos.ts`, `CustomerCRM.tsx`, `types.ts`, `AppContext.tsx`, `InventoryManager.tsx`, `CompanySettings.tsx`, `OfflineSyncIndicator.tsx`, `EditSaleModal.tsx`, `SmartRestockPredictorModal.tsx`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Should `supabase.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09990749306197964 - nodes in this community are weakly interconnected._