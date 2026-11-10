# Graph Report - Garment POS  (2026-11-10)

## Corpus Check
- 69 files · ~143,471 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 457 nodes · 1553 edges · 23 communities (18 shown, 5 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 111 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `13201a35`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useApp
- react
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
2. `react` - 52 edges
3. `lucide-react` - 49 edges
4. `AppContextType` - 38 edges
5. `EscPosBuilder` - 30 edges
6. `ThermalReceipt()` - 29 edges
7. `printThermalReceiptHtml()` - 27 edges
8. `printViaWebBluetooth()` - 26 edges
9. `AppContent()` - 22 edges
10. `Customer` - 22 edges

## Surprising Connections (you probably didn't know these)
- `StockTransferModalProps` --references--> `Product`  [EXTRACTED]
  src/components/inventory/StockTransferModal.tsx → src/types.ts
- `thermalPrinterPlugin()` --calls--> `printRawToWindowsPrinter()`  [EXTRACTED]
  vite.config.ts → src/server/printerBridge.js
- `thermalPrinterPlugin()` --calls--> `printRawToSerial()`  [EXTRACTED]
  vite.config.ts → src/server/printerBridge.js
- `thermalPrinterPlugin()` --calls--> `detectPrintersAndPorts()`  [EXTRACTED]
  vite.config.ts → src/server/printerBridge.js
- `AppContent()` --calls--> `DayRegisterManager()`  [EXTRACTED]
  src/App.tsx → src/components/cash/DayRegisterManager.tsx

## Import Cycles
- None detected.

## Communities (23 total, 5 thin omitted)

### Community 0 - "useApp"
Cohesion: 0.11
Nodes (40): App(), AppContent(), AlterationNotifyModal(), AlterationsManager(), LoginLockScreen(), CameraBarcodeScannerModal(), GarmentOsLogo(), GarmentOsLogoProps (+32 more)

### Community 1 - "react"
Cohesion: 0.18
Nodes (27): lucide-react, react, TailorTagPreviewModal(), DayRegisterManager(), EndOfDaySummaryModal(), EndOfDaySummaryModalProps, ZReportPreviewModal(), BarcodeSvg() (+19 more)

### Community 2 - "escpos.ts"
Cohesion: 0.18
Nodes (20): ThermalReceipt(), disconnectBluetoothPrinter(), disconnectUsbPrinter(), EscPosBuilder, EscPosOptions, findWritableCharacteristic(), forgetBluetoothPrinter(), formatCreditNoteToEscPos() (+12 more)

### Community 3 - "supabase.ts"
Cohesion: 0.11
Nodes (40): AppProvider(), safeLoad(), asyncSyncAlteration(), asyncSyncCreditNote(), asyncSyncCustomer(), asyncSyncDayRegister(), asyncSyncProduct(), asyncSyncPurchase() (+32 more)

### Community 4 - "CustomerCRM.tsx"
Cohesion: 0.11
Nodes (34): CustomerCRM(), CustomerProfileModal(), CustomerProfileModalProps, RELATION_OPTIONS, SHIRT_SIZE_PRESETS, WAIST_SIZE_PRESETS, CustomerPurchasesModal(), CustomerPurchasesModalProps (+26 more)

### Community 5 - "types.ts"
Cohesion: 0.11
Nodes (28): CATEGORIES, AppContextType, SupabaseConfig, AlterationDetails, AppTabDefinition, AssociateCommissionPayout, AuthState, CartItem (+20 more)

### Community 6 - "AppContext.tsx"
Cohesion: 0.11
Nodes (30): AppContext, STORAGE_KEYS, DEFAULT_LOYALTY_CONFIG, DEFAULT_STORE_BRANCHES, DEFAULT_USERS, INITIAL_ALTERATIONS, INITIAL_CAMPAIGN_TEMPLATES, INITIAL_COMMISSION_CONFIGS (+22 more)

### Community 7 - "InventoryManager.tsx"
Cohesion: 0.15
Nodes (23): BulkCsvImportModal(), BulkCsvImportModalProps, FIELD_ALIASES, FieldKey, matchHeaderToField(), parseCleanNumber(), parseCsvLine(), BulkUpdateModal() (+15 more)

### Community 8 - "package.json"
Cohesion: 0.13
Nodes (21): devDependencies, autoprefixer@^10.4.21, tailwindcss@^4.3.3, tsx@^4.21.0, @types/express@^4.17.21, @types/node@^22.14.0, @types/react@^19.3.0, @types/react-dom@^19.3.0 (+13 more)

### Community 9 - "CameraBarcodeScannerModal.tsx"
Cohesion: 0.12
Nodes (9): CameraBarcodeScannerModalProps, ErrorBoundary, Props, State, getAudioContext(), playScannerBeep(), activeStreams, installCameraGuardian() (+1 more)

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
Cohesion: 0.47
Nodes (4): StockAuditModalProps, StockAuditItem, StockAuditSession, playBarcodeBeep()

### Community 16 - "vercel.json"
Cohesion: 0.33
Nodes (5): buildCommand, framework, installCommand, rewrites, $schema

### Community 17 - "Garment OS - Retail Clothing POS & CRM"
Cohesion: 0.50
Nodes (3): 50mm Thermal Printer Settings, Complete Feature Suite, Garment OS - Retail Clothing POS & CRM

## Knowledge Gaps
- **4 isolated node(s):** `INITIAL_COUPONS`, `INITIAL_PROMOTIONS`, `INITIAL_CREDIT_NOTES`, `INITIAL_ALTERATIONS`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 87 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `useApp`, `CustomerCRM.tsx`, `types.ts`, `AppContext.tsx`, `InventoryManager.tsx`, `package.json`, `CameraBarcodeScannerModal.tsx`, `dependencies`, `CompanySettings.tsx`, `StockAuditModal.tsx`?**
  _High betweenness centrality (0.160) - this node is a cross-community bridge._
- **What connects `INITIAL_COUPONS`, `INITIAL_PROMOTIONS`, `INITIAL_CREDIT_NOTES` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useApp` be split into smaller, more focused modules?**
  _Cohesion score 0.10505050505050505 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `useApp`, `CustomerCRM.tsx`, `types.ts`, `InventoryManager.tsx`, `package.json`, `CameraBarcodeScannerModal.tsx`, `dependencies`, `CompanySettings.tsx`, `StockAuditModal.tsx`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Should `supabase.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11149825783972125 - nodes in this community are weakly interconnected._
- **Why does `useApp()` connect `useApp` to `react`, `escpos.ts`, `CustomerCRM.tsx`, `types.ts`, `AppContext.tsx`, `InventoryManager.tsx`, `CompanySettings.tsx`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `CustomerCRM.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10853658536585366 - nodes in this community are weakly interconnected._