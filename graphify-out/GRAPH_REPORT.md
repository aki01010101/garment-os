# Graph Report - Garment POS  (2026-11-14)

## Corpus Check
- 90 files · ~195,783 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 593 nodes · 2045 edges · 29 communities (22 shown, 7 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 104 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8388ae7a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useApp
- AppContextType
- escpos.ts
- supabase.ts
- CustomerCRM.tsx
- StockAuditModal.tsx
- AppContext.tsx
- SmartRestockPredictorModal.tsx
- package.json
- InventoryManager.tsx
- dependencies
- compilerOptions
- vite.config.ts
- CustomerDisplayManager.tsx
- scripts
- OfflineSyncIndicator.tsx
- vercel.json
- Garment OS - Retail Clothing POS & CRM
- types.ts
- motion@^12.23.24
- jsbarcode
- dotenv@^17.2.3
- react-is@^19.3.1
- CompanySettings.tsx
- overrides
- @vitejs/plugin-react
- GiftVouchersModal.tsx
- StockTransferModal.tsx
- pos_rules.md

## God Nodes (most connected - your core abstractions)
1. `useApp()` - 92 edges
2. `react` - 66 edges
3. `lucide-react` - 63 edges
4. `AppContextType` - 40 edges
5. `AppProvider()` - 35 edges
6. `printThermalReceiptHtml()` - 32 edges
7. `EscPosBuilder` - 31 edges
8. `ThermalReceipt()` - 30 edges
9. `Customer` - 27 edges
10. `Product` - 26 edges

## Surprising Connections (you probably didn't know these)
- `StockTransferModalProps` --references--> `Product`  [EXTRACTED]
  src/components/inventory/StockTransferModal.tsx → src/types.ts
- `CustomerLedgerModalProps` --references--> `Customer`  [EXTRACTED]
  src/components/khata/CustomerLedgerModal.tsx → src/types.ts
- `PaymentReminderModalProps` --references--> `Customer`  [EXTRACTED]
  src/components/khata/PaymentReminderModal.tsx → src/types.ts
- `EditSaleModalProps` --references--> `SaleTransaction`  [EXTRACTED]
  src/components/sales/EditSaleModal.tsx → src/types.ts
- `thermalPrinterPlugin()` --calls--> `printRawToWindowsPrinter()`  [EXTRACTED]
  vite.config.ts → src/server/printerBridge.js

## Import Cycles
- None detected.

## Communities (29 total, 7 thin omitted)

### Community 0 - "useApp"
Cohesion: 0.09
Nodes (64): lucide-react, react, App(), AppContent(), AlterationNotifyModal(), AlterationsManager(), TailorTagPreviewModal(), CloudAuthModal() (+56 more)

### Community 1 - "AppContextType"
Cohesion: 0.12
Nodes (17): BarcodeSvgProps, AppContextType, SupabaseConfig, AlterationDetails, AssociateCommissionPayout, CartItem, CashDrop, CloudUser (+9 more)

### Community 2 - "escpos.ts"
Cohesion: 0.18
Nodes (22): ThermalReceipt(), disconnectBluetoothPrinter(), disconnectUsbPrinter(), EscPosBuilder, EscPosOptions, findWritableCharacteristic(), forgetBluetoothPrinter(), formatCreditNoteToEscPos() (+14 more)

### Community 3 - "supabase.ts"
Cohesion: 0.08
Nodes (62): AppProvider(), asyncSyncAlteration(), asyncSyncCompany(), asyncSyncCreditNote(), asyncSyncCustomer(), asyncSyncCustomerDisplayConfig(), asyncSyncCustomerMeasurement(), asyncSyncDayRegister() (+54 more)

### Community 4 - "CustomerCRM.tsx"
Cohesion: 0.09
Nodes (47): ManagerPinOverrideModal(), SignaturePadModal(), SignaturePadModalProps, CelebrationEvent, CelebrationsManager(), CustomerCRM(), CustomerMeasurementModal, CustomerMeasurementModalProps (+39 more)

### Community 5 - "StockAuditModal.tsx"
Cohesion: 0.14
Nodes (6): ErrorBoundary, Props, State, activeStreams, installCameraGuardian(), stopAllCameraHardware()

### Community 6 - "AppContext.tsx"
Cohesion: 0.10
Nodes (30): AppContext, INITIAL_GIFT_VOUCHERS, safeLoad(), STORAGE_KEYS, DEFAULT_LOYALTY_CONFIG, DEFAULT_STORE_BRANCHES, DEFAULT_USERS, INITIAL_ALTERATIONS (+22 more)

### Community 7 - "SmartRestockPredictorModal.tsx"
Cohesion: 0.50
Nodes (4): RestockPrediction, SmartRestockPredictorModalProps, PurchaseOrder, Vendor

### Community 8 - "package.json"
Cohesion: 0.13
Nodes (21): devDependencies, autoprefixer@^10.4.21, tailwindcss@^4.3.3, tsx@^4.21.0, @types/express@^4.17.21, @types/node@^22.14.0, @types/react@^19.3.0, @types/react-dom@^19.3.0 (+13 more)

### Community 9 - "InventoryManager.tsx"
Cohesion: 0.06
Nodes (56): CameraBarcodeScannerModal(), CameraBarcodeScannerModalProps, BulkCsvImportModal(), BulkCsvImportModalProps, FIELD_ALIASES, FieldKey, matchHeaderToField(), parseCleanNumber() (+48 more)

### Community 10 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, express@^4.21.2, @google/genai@^2.4.0, html5-qrcode@^2.3.8, lucide-react@^0.546.0, qrcode@^1.5.4, react@^19.0.1, react-dom@^19.0.1 (+12 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+9 more)

### Community 12 - "vite.config.ts"
Cohesion: 0.22
Nodes (8): @tailwindcss/vite@^4.3.3, vite@^8.3.0, @tailwindcss/vite, vite, detectPrintersAndPorts(), printRawToSerial(), printRawToWindowsPrinter(), thermalPrinterPlugin()

### Community 13 - "CustomerDisplayManager.tsx"
Cohesion: 0.13
Nodes (29): qrcode, UpiPaymentQrProps, CustomerDisplay(), CustomerDisplayManager(), CustomerDisplayPayload, CHANNEL_NAME, CONFIG_EVENT_NAME, CONFIG_STORAGE_KEY (+21 more)

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

### Community 18 - "types.ts"
Cohesion: 0.09
Nodes (23): ACCENT_COLOR_PRESETS, RETURN_POLICY_PRESETS, EditSaleModalProps, CATEGORIES, ALL_APP_TABS, AppTabDefinition, AuthState, CompanyType (+15 more)

### Community 23 - "CompanySettings.tsx"
Cohesion: 0.38
Nodes (6): AlterationNotifyModalProps, TailorTagPreviewModalProps, ZReportPreviewModalProps, AlterationRecord, Company, DayEndRegister

### Community 26 - "GiftVouchersModal.tsx"
Cohesion: 0.50
Nodes (3): GiftVouchersModalProps, PRESET_AMOUNTS, GiftVoucher

### Community 27 - "StockTransferModal.tsx"
Cohesion: 0.40
Nodes (4): StockTransferModalProps, StockTransferItem, StockTransferOrder, StockTransferStatus

## Knowledge Gaps
- **3 isolated node(s):** `INITIAL_PROMOTIONS`, `INITIAL_CREDIT_NOTES`, `INITIAL_ALTERATIONS`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 116 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `useApp` to `CustomerCRM.tsx`, `StockAuditModal.tsx`, `AppContext.tsx`, `SmartRestockPredictorModal.tsx`, `package.json`, `InventoryManager.tsx`, `dependencies`, `CustomerDisplayManager.tsx`, `OfflineSyncIndicator.tsx`, `types.ts`, `CompanySettings.tsx`, `GiftVouchersModal.tsx`, `StockTransferModal.tsx`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **What connects `INITIAL_PROMOTIONS`, `INITIAL_CREDIT_NOTES`, `INITIAL_ALTERATIONS` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useApp` be split into smaller, more focused modules?**
  _Cohesion score 0.08837719298245614 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `useApp` to `CustomerCRM.tsx`, `StockAuditModal.tsx`, `SmartRestockPredictorModal.tsx`, `package.json`, `InventoryManager.tsx`, `dependencies`, `CustomerDisplayManager.tsx`, `OfflineSyncIndicator.tsx`, `types.ts`, `CompanySettings.tsx`, `GiftVouchersModal.tsx`, `StockTransferModal.tsx`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Should `AppContextType` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Why does `useApp()` connect `useApp` to `escpos.ts`, `CustomerCRM.tsx`, `AppContext.tsx`, `SmartRestockPredictorModal.tsx`, `InventoryManager.tsx`, `CustomerDisplayManager.tsx`, `OfflineSyncIndicator.tsx`, `types.ts`, `GiftVouchersModal.tsx`, `StockTransferModal.tsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Should `supabase.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08461538461538462 - nodes in this community are weakly interconnected._