# Garment OS - Retail Clothing POS & CRM

A modern, responsive web-based Point-of-Sale (POS) and Customer Relationship Management (CRM) system designed specifically for apparel and retail fashion businesses.

---

## Complete Feature Suite

1. **Multi-Company Billing System**
   - Manage distinct business entities:
     - **Official Billed Entity** (e.g. *Garment OS Apparel Pvt Ltd* with GSTIN: `07AABCV1234F1Z8`, Invoice prefix: `INV-GOS-1045`).
     - **Cash Retail Counter** (e.g. *Garment OS Counter* for unbilled cash memos: `BILL-GOS-2088`).
   - Switch billing entity on the fly directly in the POS header.

2. **Garment Returns, Exchanges & Store Credit Notes**
   - Lookup past customer invoices by bill number or mobile number.
   - Select garments being returned and categorize reasons (Size Mismatch, Defective Fabric, Style Exchange).
   - Defective garments are quarantined into `defectiveStock` rather than mixed with active floor stock.
   - Issues 50mm printable **Store Credit Note Vouchers** (e.g. `CN-1042`, 30-day validity) that can be redeemed directly at POS checkout.

3. **In-Store Tailoring & Alteration Tracker**
   - Attach alteration fitting instructions directly to any garment in a sale (e.g., *“Shorten length by 1.5 inches, waist taper 1 inch”*).
   - Assign Master Tailor (e.g., Master Rafiq) with promised delivery date.
   - Print companion 50mm **Tailor Tag** to staple directly onto the garment.
   - Dedicated Alterations dashboard to manage jobs from *In Progress* $\rightarrow$ *Ready for Pickup* $\rightarrow$ *Delivered*.

4. **WhatsApp Digital Receipt Sharing**
   - 1-click **Share on WhatsApp** directly from the receipt preview modal.
   - Formats complete itemized bill with garment sizes, colors, tax, net amount, and store thank-you message.
   - Also includes 1-click **Copy Text** for SMS or customer messaging.

5. **Day-End Cash Drawer Reconciliation (Z-Report)**
   - Record morning **Opening Cash Float** loaded into the till.
   - Real-time tracking of today's Cash sales inflow vs. digital (UPI/Card) sales.
   - Log daily **Petty Cash Expenses** (Tea & Refreshments, Packaging bags, Courier, Staff food).
   - Evening Cash Counting tally (by note denominations: ₹500, ₹200, ₹100, ₹50, ₹20, ₹10) with automatic Over/Short discrepancy calculation.
   - Print official 50mm **Day-End Z-Report** summarizing all tenders and drawer balance.

6. **POS Keyboard Shortcuts & Barcode Beep**
   - **Audio Feedback**: Built-in 1750 Hz barcode scanner beep (using Web Audio API, with instant mute toggle).
   - **Keyboard Shortcuts**:
     - `F2` or `/`: Jump focus directly to search bar.
     - `F4`: Cycle payment mode (Cash $\rightarrow$ UPI $\rightarrow$ Card $\rightarrow$ Split).
     - `Enter`: Instant barcode scan add.
     - `Ctrl + Enter`: Complete and print receipt.

7. **Promotions, Coupons & Sales Associates**
   - Redeem promo codes (`WELCOME10`, `FESTIVE20`, `FLAT500`).
   - Tag floor sales stylists/associates to measure individual sales volume.

8. **Vendor & Inward Purchase Management (Cash vs. Billed Dual Ledgers)**
   - Segregated accounts payable balances per supplier (`billedPayableBalance` vs. `cashPayableBalance`).
   - Inward inventory automatically increments stock.

9. **50mm / 2-Inch Thermal Receipt Printing**
   - Tailored specifically for 50mm / 58mm thermal receipt printers (~48mm active printable width / ~32 characters per line).
   - Full GST breakdown (CGST + SGST) for billed entities.

10. **Apparel Price Tag & Barcode Generator**
    - Batch generator for thermal adhesive clothing tags (50mm x 32mm roll or Avery sheets).
    - Encodes vector scannable barcodes, store brand header, SKU, size box, color, season, and MRP.

11. **Customer CRM & Loyalty Points**
    - Track customer spend, repeat visits, and loyalty points (earn points per ₹100, 1-click redemption).

---

## 50mm Thermal Printer Settings
- **Destination**: Connected 50mm/58mm thermal receipt printer.
- **Paper Size**: 58mm Roll / 50mm Continuous.
- **Margins**: Set to **"None"** or **"Minimum"**.
- **Headers and Footers**: **Uncheck**.
