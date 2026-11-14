---
trigger: always_on
description: Core POS business rules for billing, discounts, coupons, and credit notes.
---

# POS Business Rules

1. **Never auto-apply coupons or credit notes in POS; show them first**:
   - In POS billing and checkout, never silently or automatically apply coupons, promotions with coupon codes, or store credit notes to a bill.
   - Always display eligible coupons, available promotional vouchers, and customer credit notes clearly in the UI first (with their value, code, and expiry).
   - Require an explicit user action (e.g., clicking an "Apply" button) after cashier/customer confirmation before any discount or credit note is applied to the transaction total.

