# Graph Report - Garment POS  (2026-11-18)

## Corpus Check
- 91 files · ~202,830 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 606 nodes · 2102 edges · 29 communities (21 shown, 8 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 103 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d8f61201`
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
- Company
- package.json
- InventoryManager.tsx
- dependencies
- compilerOptions
- vite.config.ts
- CustomerDisplayManager.tsx
- scripts
- escpos.ts
- vercel.json
- Garment OS - Retail Clothing POS & CRM
- types.ts
- StockTransferModal.tsx
- react-dom
- html5-qrcode
- recharts
- motion@^12.23.24
- overrides
- @vitejs/plugin-react
- GiftVouchersModal.tsx
- CustomerCreditPayment
- pos_rules.md

## God Nodes (most connected - your core abstractions)
1. `useApp()` - 94 edges
2. `react` - 67 edges
3. `lucide-react` - 64 edges
4. `AppContextType` - 42 edges
5. `AppProvider()` - 38 edges
6. `EscPosBuilder` - 32 edges
7. `printThermalReceiptHtml()` - 32 edges
8. `ThermalReceipt()` - 31 edges
9. `Customer` - 27 edges
10. `Product` - 26 edges

## Surprising Connections (you probably didn't know these)
- `ExtractedInvoiceItem` --references--> `ClothingCategory`  [EXTRACTED]
  src/components/vendors/InvoiceInwardingModal.tsx → src/types.ts
- `StockTransferModalProps` --references--> `Product`  [EXTRACTED]
  src/components/inventory/StockTransferModal.tsx → src/types.ts
- `CustomerLedgerModalProps` --references--> `Customer`  [EXTRACTED]
  src/components/khata/CustomerLedgerModal.tsx → src/types.ts
- `PaymentReminderModalProps` --references--> `Customer`  [EXTRACTED]
  src/components/khata/PaymentReminderModal.tsx → src/types.ts
- `registerPrinterRoutes()` --calls--> `detectPrintersAndPorts()`  [EXTRACTED]
  vite.config.ts → src/server/printerBridge.js

## Import Cycles
- None detected.

## Communities (29 total, 8 thin omitted)

### Community 0 - "useApp"
Cohesion: 0.08
Nodes (52): lucide-react, react, App(), AppContent(), AlterationNotifyModal(), AlterationsManager(), CloudAuthModal(), LoginLockScreen() (+44 more)

### Community 1 - "AppContextType"
Cohesion: 0.12
Nodes (16): AppContextType, SupabaseConfig, AlterationDetails, AssociateCommissionPayout, BulkProductUpdate, CartItem, CashDrop, CloudUser (+8 more)

### Community 2 - "escpos.ts"
Cohesion: 0.30
Nodes (9): ThermalReceipt(), EscPosBuilder, formatCreditNoteToEscPos(), formatCreditPaymentReceiptToEscPos(), formatCustomerKhataStatementToEscPos(), formatPriceTagsToEscPos(), formatSaleToEscPos(), formatTailorSlipToEscPos() (+1 more)

### Community 3 - "supabase.ts"
Cohesion: 0.08
Nodes (66): ACCENT_COLOR_PRESETS, RETURN_POLICY_PRESETS, AppProvider(), safeLoad(), asyncSyncAlteration(), asyncSyncCompany(), asyncSyncCreditNote(), asyncSyncCustomer() (+58 more)

### Community 4 - "CustomerCRM.tsx"
Cohesion: 0.08
Nodes (50): ManagerPinOverrideModal(), SignaturePadModal(), SignaturePadModalProps, CelebrationEvent, CelebrationsManager(), CustomerCRM(), CustomerMeasurementModal, CustomerMeasurementModalProps (+42 more)

### Community 5 - "StockAuditModal.tsx"
Cohesion: 0.14
Nodes (6): ErrorBoundary, Props, State, activeStreams, installCameraGuardian(), stopAllCameraHardware()

### Community 6 - "AppContext.tsx"
Cohesion: 0.11
Nodes (29): AppContext, INITIAL_GIFT_VOUCHERS, STORAGE_KEYS, DEFAULT_LOYALTY_CONFIG, DEFAULT_STORE_BRANCHES, DEFAULT_USERS, INITIAL_ALTERATIONS, INITIAL_CAMPAIGN_TEMPLATES (+21 more)

### Community 7 - "Company"
Cohesion: 0.38
Nodes (6): AlterationNotifyModalProps, TailorTagPreviewModalProps, ZReportPreviewModalProps, AlterationRecord, Company, DayEndRegister

### Community 8 - "package.json"
Cohesion: 0.13
Nodes (21): devDependencies, autoprefixer@^10.4.21, tailwindcss@^4.3.3, tsx@^4.21.0, @types/express@^4.17.21, @types/node@^22.14.0, @types/react@^19.3.0, @types/react-dom@^19.3.0 (+13 more)

### Community 9 - "InventoryManager.tsx"
Cohesion: 0.08
Nodes (46): BulkCsvImportModal(), BulkCsvImportModalProps, FIELD_ALIASES, FieldKey, matchHeaderToField(), parseCleanNumber(), parseCsvLine(), BulkUpdateModal() (+38 more)

### Community 10 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, dotenv@^17.2.3, express@^4.21.2, @google/genai@^2.4.0, jsbarcode@^3.12.3, lucide-react@^0.546.0, qrcode@^1.5.4, react@^19.0.1 (+12 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+9 more)

### Community 12 - "vite.config.ts"
Cohesion: 0.20
Nodes (8): @tailwindcss/vite@^4.3.3, vite@^8.3.0, @tailwindcss/vite, vite, detectPrintersAndPorts(), printRawToSerial(), printRawToWindowsPrinter(), registerPrinterRoutes()

### Community 13 - "CustomerDisplayManager.tsx"
Cohesion: 0.13
Nodes (28): UpiPaymentQrProps, CustomerDisplay(), CustomerDisplayManager(), CustomerDisplayPayload, CHANNEL_NAME, CONFIG_EVENT_NAME, CONFIG_STORAGE_KEY, CustomerDisplayCustomConfig (+20 more)

### Community 14 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, clean, dev, lint, preview

### Community 15 - "escpos.ts"
Cohesion: 0.10
Nodes (50): qrcode, TailorTagPreviewModal(), ZReportPreviewModal(), BarcodeSvg(), BarcodeSvgProps, GoogleReviewQr(), GoogleReviewQrProps, UpiPaymentQr() (+42 more)

### Community 16 - "vercel.json"
Cohesion: 0.33
Nodes (5): buildCommand, framework, installCommand, rewrites, $schema

### Community 17 - "Garment OS - Retail Clothing POS & CRM"
Cohesion: 0.50
Nodes (3): 50mm Thermal Printer Settings, Complete Feature Suite, Garment OS - Retail Clothing POS & CRM

### Community 18 - "types.ts"
Cohesion: 0.10
Nodes (22): CATEGORIES, AppTabDefinition, AuthState, CLOTHING_SIZE_GROUPS, CompanyType, CreditNoteItem, CreditStatus, CustomerCreditPaymentAllocation (+14 more)

### Community 19 - "StockTransferModal.tsx"
Cohesion: 0.40
Nodes (4): StockTransferModalProps, StockTransferItem, StockTransferOrder, StockTransferStatus

### Community 26 - "GiftVouchersModal.tsx"
Cohesion: 0.50
Nodes (3): GiftVouchersModalProps, PRESET_AMOUNTS, GiftVoucher

## Knowledge Gaps
- **3 isolated node(s):** `INITIAL_PROMOTIONS`, `INITIAL_CREDIT_NOTES`, `INITIAL_ALTERATIONS`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 118 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `useApp` to `supabase.ts`, `CustomerCRM.tsx`, `StockAuditModal.tsx`, `AppContext.tsx`, `Company`, `package.json`, `InventoryManager.tsx`, `dependencies`, `CustomerDisplayManager.tsx`, `escpos.ts`, `types.ts`, `StockTransferModal.tsx`, `GiftVouchersModal.tsx`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **What connects `INITIAL_PROMOTIONS`, `INITIAL_CREDIT_NOTES`, `INITIAL_ALTERATIONS` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useApp` be split into smaller, more focused modules?**
  _Cohesion score 0.07894736842105263 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `useApp` to `supabase.ts`, `CustomerCRM.tsx`, `StockAuditModal.tsx`, `Company`, `package.json`, `InventoryManager.tsx`, `dependencies`, `CustomerDisplayManager.tsx`, `escpos.ts`, `types.ts`, `StockTransferModal.tsx`, `GiftVouchersModal.tsx`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Should `AppContextType` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Why does `useApp()` connect `useApp` to `escpos.ts`, `supabase.ts`, `CustomerCRM.tsx`, `AppContext.tsx`, `InventoryManager.tsx`, `CustomerDisplayManager.tsx`, `escpos.ts`, `types.ts`, `StockTransferModal.tsx`, `GiftVouchersModal.tsx`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Should `supabase.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07536231884057971 - nodes in this community are weakly interconnected._