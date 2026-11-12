# Graph Report - Garment POS  (2026-11-12)

## Corpus Check
- 85 files · ~179,956 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 557 nodes · 1912 edges · 26 communities (20 shown, 6 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 104 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `606c0b0b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useApp
- InvoiceInwardingModal.tsx
- escpos.ts
- supabase.ts
- CustomerCRM.tsx
- StockAuditModal.tsx
- AppContext.tsx
- types.ts
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
- BulkCsvImportModal.tsx
- motion@^12.23.24
- StockAuditModal.tsx
- dotenv@^17.2.3
- react-is@^19.3.1
- jsbarcode
- overrides
- @vitejs/plugin-react

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
10. `getSupabase()` - 26 edges

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

## Communities (26 total, 6 thin omitted)

### Community 0 - "useApp"
Cohesion: 0.07
Nodes (75): lucide-react, qrcode, react, App(), AppContent(), AlterationNotifyModal(), AlterationNotifyModalProps, AlterationsManager() (+67 more)

### Community 1 - "InvoiceInwardingModal.tsx"
Cohesion: 0.16
Nodes (16): RestockPrediction, SmartRestockPredictorModalProps, COMMON_PRESETS, CustomItemModalProps, CustomItemPayload, PRICE_SHORTCUTS, ExtractedInvoiceItem, InvoiceInwardingModal() (+8 more)

### Community 2 - "escpos.ts"
Cohesion: 0.19
Nodes (20): ThermalReceipt(), KhataLedgerEntry, disconnectBluetoothPrinter(), disconnectUsbPrinter(), EscPosBuilder, EscPosOptions, findWritableCharacteristic(), forgetBluetoothPrinter() (+12 more)

### Community 3 - "supabase.ts"
Cohesion: 0.09
Nodes (58): AppProvider(), asyncSyncAlteration(), asyncSyncCompany(), asyncSyncCreditNote(), asyncSyncCustomer(), asyncSyncCustomerMeasurement(), asyncSyncDayRegister(), asyncSyncDeletePromotion() (+50 more)

### Community 4 - "CustomerCRM.tsx"
Cohesion: 0.07
Nodes (52): ManagerPinOverrideModal(), ManagerPinOverrideModalProps, SignaturePadModal(), SignaturePadModalProps, CelebrationEvent, CelebrationsManager(), CustomerCRM(), CustomerMeasurementModal (+44 more)

### Community 5 - "StockAuditModal.tsx"
Cohesion: 0.12
Nodes (9): CameraBarcodeScannerModalProps, ErrorBoundary, Props, State, getAudioContext(), playScannerBeep(), activeStreams, installCameraGuardian() (+1 more)

### Community 6 - "AppContext.tsx"
Cohesion: 0.10
Nodes (30): AppContext, INITIAL_GIFT_VOUCHERS, safeLoad(), STORAGE_KEYS, DEFAULT_LOYALTY_CONFIG, DEFAULT_STORE_BRANCHES, DEFAULT_USERS, INITIAL_ALTERATIONS (+22 more)

### Community 7 - "types.ts"
Cohesion: 0.07
Nodes (39): ZReportPreviewModalProps, BarcodeSvgProps, StockTransferModalProps, EditSaleModalProps, AppContextType, SupabaseConfig, ALL_APP_TABS, AlterationDetails (+31 more)

### Community 8 - "package.json"
Cohesion: 0.13
Nodes (21): devDependencies, autoprefixer@^10.4.21, tailwindcss@^4.3.3, tsx@^4.21.0, @types/express@^4.17.21, @types/node@^22.14.0, @types/react@^19.3.0, @types/react-dom@^19.3.0 (+13 more)

### Community 9 - "InventoryManager.tsx"
Cohesion: 0.15
Nodes (21): WhatsAppLookbookModal(), BulkUpdateModal(), BulkUpdateModalProps, DeadStockItem, DeadStockLiquidatorModal(), DeadStockLiquidatorModalProps, SmartBundleSuggestion, InventoryManager() (+13 more)

### Community 10 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, express@^4.21.2, @google/genai@^2.4.0, html5-qrcode@^2.3.8, lucide-react@^0.546.0, qrcode@^1.5.4, react@^19.0.1, react-dom@^19.0.1 (+12 more)

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

### Community 18 - "BulkCsvImportModal.tsx"
Cohesion: 0.33
Nodes (8): BulkCsvImportModal(), BulkCsvImportModalProps, FIELD_ALIASES, FieldKey, matchHeaderToField(), parseCleanNumber(), parseCsvLine(), BulkCsvImportRow

### Community 20 - "StockAuditModal.tsx"
Cohesion: 0.39
Nodes (6): CameraBarcodeScannerModal(), StockAuditModal(), StockAuditModalProps, StockAuditItem, StockAuditSession, playBarcodeBeep()

## Knowledge Gaps
- **4 isolated node(s):** `INITIAL_ALTERATIONS`, `INITIAL_COUPONS`, `INITIAL_CREDIT_NOTES`, `INITIAL_PROMOTIONS`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 111 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `useApp` to `InvoiceInwardingModal.tsx`, `CustomerCRM.tsx`, `StockAuditModal.tsx`, `AppContext.tsx`, `types.ts`, `package.json`, `InventoryManager.tsx`, `dependencies`, `CustomerDisplay.tsx`, `OfflineSyncIndicator.tsx`, `BulkCsvImportModal.tsx`, `StockAuditModal.tsx`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **What connects `INITIAL_ALTERATIONS`, `INITIAL_COUPONS`, `INITIAL_CREDIT_NOTES` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useApp` be split into smaller, more focused modules?**
  _Cohesion score 0.07339449541284404 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `useApp` to `InvoiceInwardingModal.tsx`, `CustomerCRM.tsx`, `StockAuditModal.tsx`, `types.ts`, `package.json`, `InventoryManager.tsx`, `dependencies`, `CustomerDisplay.tsx`, `OfflineSyncIndicator.tsx`, `BulkCsvImportModal.tsx`, `StockAuditModal.tsx`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Should `supabase.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09016393442622951 - nodes in this community are weakly interconnected._
- **Why does `useApp()` connect `useApp` to `InvoiceInwardingModal.tsx`, `escpos.ts`, `CustomerCRM.tsx`, `AppContext.tsx`, `types.ts`, `InventoryManager.tsx`, `OfflineSyncIndicator.tsx`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Should `CustomerCRM.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0710085933966531 - nodes in this community are weakly interconnected._