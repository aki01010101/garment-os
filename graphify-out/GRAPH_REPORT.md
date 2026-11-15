# Graph Report - Garment POS  (2026-11-15)

## Corpus Check
- 90 files · ~196,436 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 599 nodes · 2062 edges · 27 communities (20 shown, 7 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 103 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c6495f2e`
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
- InvoiceInwardingModal.tsx
- package.json
- InventoryManager.tsx
- dependencies
- compilerOptions
- vite.config.ts
- CustomerDisplayManager.tsx
- scripts
- printThermalReceiptHtml
- vercel.json
- Garment OS - Retail Clothing POS & CRM
- types.ts
- BarcodeSvg.tsx
- react-dom
- dotenv@^17.2.3
- recharts
- @tailwindcss/vite
- overrides
- GiftVouchersModal.tsx
- pos_rules.md

## God Nodes (most connected - your core abstractions)
1. `useApp()` - 92 edges
2. `react` - 66 edges
3. `lucide-react` - 63 edges
4. `AppContextType` - 40 edges
5. `AppProvider()` - 38 edges
6. `EscPosBuilder` - 32 edges
7. `printThermalReceiptHtml()` - 32 edges
8. `ThermalReceipt()` - 30 edges
9. `Customer` - 27 edges
10. `printViaWebBluetooth()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `registerPrinterRoutes()` --calls--> `printRawToWindowsPrinter()`  [EXTRACTED]
  vite.config.ts → src/server/printerBridge.js
- `registerPrinterRoutes()` --calls--> `printRawToSerial()`  [EXTRACTED]
  vite.config.ts → src/server/printerBridge.js
- `registerPrinterRoutes()` --calls--> `detectPrintersAndPorts()`  [EXTRACTED]
  vite.config.ts → src/server/printerBridge.js
- `StockTransferModalProps` --references--> `Product`  [EXTRACTED]
  src/components/inventory/StockTransferModal.tsx → src/types.ts
- `ExtractedInvoiceItem` --references--> `ClothingCategory`  [EXTRACTED]
  src/components/vendors/InvoiceInwardingModal.tsx → src/types.ts

## Import Cycles
- None detected.

## Communities (27 total, 7 thin omitted)

### Community 0 - "useApp"
Cohesion: 0.09
Nodes (52): lucide-react, react, App(), AppContent(), AlterationNotifyModal(), AlterationNotifyModalProps, AlterationsManager(), TailorTagPreviewModal() (+44 more)

### Community 1 - "AppContextType"
Cohesion: 0.12
Nodes (17): ZReportPreviewModalProps, AppContextType, SupabaseConfig, AlterationDetails, AssociateCommissionPayout, BulkProductUpdate, CartItem, CashDrop (+9 more)

### Community 2 - "escpos.ts"
Cohesion: 0.19
Nodes (19): ThermalReceipt(), disconnectBluetoothPrinter(), disconnectUsbPrinter(), EscPosBuilder, EscPosOptions, forgetBluetoothPrinter(), formatCreditNoteToEscPos(), formatCreditPaymentReceiptToEscPos() (+11 more)

### Community 3 - "supabase.ts"
Cohesion: 0.08
Nodes (62): AppProvider(), asyncSyncAlteration(), asyncSyncCompany(), asyncSyncCreditNote(), asyncSyncCustomer(), asyncSyncCustomerDisplayConfig(), asyncSyncCustomerMeasurement(), asyncSyncDayRegister() (+54 more)

### Community 4 - "CustomerCRM.tsx"
Cohesion: 0.10
Nodes (42): ManagerPinOverrideModal(), ManagerPinOverrideModalProps, SignaturePadModal(), SignaturePadModalProps, CelebrationEvent, CelebrationsManager(), CustomerCRM(), CustomerMeasurementModal (+34 more)

### Community 5 - "StockAuditModal.tsx"
Cohesion: 0.14
Nodes (6): ErrorBoundary, Props, State, activeStreams, installCameraGuardian(), stopAllCameraHardware()

### Community 6 - "AppContext.tsx"
Cohesion: 0.11
Nodes (29): AppContext, INITIAL_GIFT_VOUCHERS, safeLoad(), STORAGE_KEYS, DEFAULT_LOYALTY_CONFIG, DEFAULT_STORE_BRANCHES, DEFAULT_USERS, INITIAL_ALTERATIONS (+21 more)

### Community 7 - "InvoiceInwardingModal.tsx"
Cohesion: 0.27
Nodes (8): RestockPrediction, SmartRestockPredictorModalProps, ExtractedInvoiceItem, InvoiceInwardingModalProps, SAMPLE_INVOICES, PurchaseItem, PurchaseOrder, Vendor

### Community 8 - "package.json"
Cohesion: 0.13
Nodes (21): devDependencies, autoprefixer@^10.4.21, tailwindcss@^4.3.3, tsx@^4.21.0, @types/express@^4.17.21, @types/node@^22.14.0, @types/react@^19.3.0, @types/react-dom@^19.3.0 (+13 more)

### Community 9 - "InventoryManager.tsx"
Cohesion: 0.07
Nodes (55): CameraBarcodeScannerModal(), CameraBarcodeScannerModalProps, BulkCsvImportModal(), BulkCsvImportModalProps, FIELD_ALIASES, FieldKey, matchHeaderToField(), parseCleanNumber() (+47 more)

### Community 10 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, express@^4.21.2, @google/genai@^2.4.0, html5-qrcode@^2.3.8, jsbarcode@^3.12.3, lucide-react@^0.546.0, motion@^12.23.24, react@^19.0.1 (+13 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+9 more)

### Community 12 - "vite.config.ts"
Cohesion: 0.20
Nodes (8): vite@^8.3.0, @vitejs/plugin-react@^6.1.1, vite, @vitejs/plugin-react, detectPrintersAndPorts(), printRawToSerial(), printRawToWindowsPrinter(), registerPrinterRoutes()

### Community 13 - "CustomerDisplayManager.tsx"
Cohesion: 0.12
Nodes (28): qrcode@^1.5.4, qrcode, UpiPaymentQrProps, CustomerDisplay(), CustomerDisplayPayload, CHANNEL_NAME, CONFIG_EVENT_NAME, CONFIG_STORAGE_KEY (+20 more)

### Community 14 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, clean, dev, lint, preview

### Community 15 - "printThermalReceiptHtml"
Cohesion: 0.10
Nodes (38): DayRegisterManager(), EndOfDaySummaryModal(), EndOfDaySummaryModalProps, ZReportPreviewModal(), CustomerMeasurementModalProps, GARMENT_TYPES, PRESET_STANDARDS, CustomerPurchasesModalProps (+30 more)

### Community 16 - "vercel.json"
Cohesion: 0.33
Nodes (5): buildCommand, framework, installCommand, rewrites, $schema

### Community 17 - "Garment OS - Retail Clothing POS & CRM"
Cohesion: 0.50
Nodes (3): 50mm Thermal Printer Settings, Complete Feature Suite, Garment OS - Retail Clothing POS & CRM

### Community 18 - "types.ts"
Cohesion: 0.09
Nodes (23): StockTransferModalProps, CATEGORIES, ALL_APP_TABS, AppTabDefinition, AuthState, CompanyType, CreditNoteItem, CreditStatus (+15 more)

### Community 26 - "GiftVouchersModal.tsx"
Cohesion: 0.50
Nodes (3): GiftVouchersModalProps, PRESET_AMOUNTS, GiftVoucher

## Knowledge Gaps
- **3 isolated node(s):** `INITIAL_ALTERATIONS`, `INITIAL_CREDIT_NOTES`, `INITIAL_PROMOTIONS`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 118 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `useApp` to `escpos.ts`, `CustomerCRM.tsx`, `StockAuditModal.tsx`, `AppContext.tsx`, `InvoiceInwardingModal.tsx`, `package.json`, `InventoryManager.tsx`, `dependencies`, `CustomerDisplayManager.tsx`, `printThermalReceiptHtml`, `types.ts`, `BarcodeSvg.tsx`, `GiftVouchersModal.tsx`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **What connects `INITIAL_ALTERATIONS`, `INITIAL_CREDIT_NOTES`, `INITIAL_PROMOTIONS` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useApp` be split into smaller, more focused modules?**
  _Cohesion score 0.08842105263157894 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `useApp` to `escpos.ts`, `CustomerCRM.tsx`, `StockAuditModal.tsx`, `InvoiceInwardingModal.tsx`, `package.json`, `InventoryManager.tsx`, `dependencies`, `CustomerDisplayManager.tsx`, `printThermalReceiptHtml`, `types.ts`, `GiftVouchersModal.tsx`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Should `AppContextType` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Why does `useApp()` connect `useApp` to `escpos.ts`, `CustomerCRM.tsx`, `AppContext.tsx`, `InvoiceInwardingModal.tsx`, `InventoryManager.tsx`, `CustomerDisplayManager.tsx`, `printThermalReceiptHtml`, `types.ts`, `BarcodeSvg.tsx`, `GiftVouchersModal.tsx`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Should `supabase.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08461538461538462 - nodes in this community are weakly interconnected._