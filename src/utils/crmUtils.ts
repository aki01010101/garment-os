import { Customer, SaleTransaction } from '../types';

export interface CustomerSpendMetrics {
  monthlySpend: number;
  monthLabel: string;
  isVip: boolean;
  vipThreshold: number;
  progressPercent: number;
  remainingForVip: number;
  lifetimeSpend: number;
  totalOrders: number;
  totalGarments: number;
  averageOrderValue: number;
  recentSales: SaleTransaction[];
}

/**
 * Normalizes phone numbers for reliable comparison (strips spaces, dashes, +91).
 */
export function normalizePhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/[\s\-\(\)\+]/g, '').slice(-10);
}

/**
 * Retrieves all sales matching a customer by ID or Phone number, sorted newest first.
 */
export function getCustomerPurchases(
  customer: { id?: string; phone?: string; name?: string },
  sales: SaleTransaction[]
): SaleTransaction[] {
  const normPhone = normalizePhone(customer.phone);
  return sales
    .filter((s) => {
      if (customer.id && s.customerId === customer.id) return true;
      if (normPhone && s.customerPhone && normalizePhone(s.customerPhone) === normPhone) return true;
      if (
        customer.name &&
        s.customerName &&
        customer.name.trim().toLowerCase() === s.customerName.trim().toLowerCase() &&
        customer.name.trim().toLowerCase() !== 'walk-in retail shopper'
      ) {
        return true;
      }
      return false;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Calculates current/recent monthly purchase volume and VIP tier eligibility.
 * Threshold defaults to ₹5,000 monthly spend.
 */
export function computeCustomerSpendMetrics(
  customer: Customer,
  sales: SaleTransaction[],
  customThreshold: number = 5000
): CustomerSpendMetrics {
  const threshold = customThreshold > 0 ? customThreshold : 5000;
  const custSales = getCustomerPurchases(customer, sales);

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // 1. Current calendar month spend
  const currentMonthSales = custSales.filter((s) => s.date.startsWith(currentMonthKey));
  const currentMonthSpend = currentMonthSales.reduce((sum, s) => sum + s.grandTotal, 0);

  // 2. Rolling 30-day spend
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const rolling30DaySales = custSales.filter((s) => new Date(s.date) >= thirtyDaysAgo);
  const rolling30DaySpend = rolling30DaySales.reduce((sum, s) => sum + s.grandTotal, 0);

  // 3. Month-wise grouping to support historical/seed dataset evaluations
  const monthMap: Record<string, number> = {};
  custSales.forEach((s) => {
    const m = s.date.slice(0, 7);
    monthMap[m] = (monthMap[m] || 0) + s.grandTotal;
  });

  const sortedMonths = Object.keys(monthMap).sort().reverse();
  const latestMonthKey = sortedMonths[0];
  const latestMonthSpend = latestMonthKey ? monthMap[latestMonthKey] : 0;

  // Determination logic:
  // - If current month has active spend, use current month (or rolling 30 days if higher)
  // - If testing with seed data where today's month differs from dataset, evaluate against the customer's latest active month
  let monthlySpend = currentMonthSpend;
  let activeMonthKey = currentMonthKey;

  if (rolling30DaySpend > monthlySpend) {
    monthlySpend = rolling30DaySpend;
  }

  if (monthlySpend === 0 && latestMonthSpend > 0) {
    monthlySpend = latestMonthSpend;
    activeMonthKey = latestMonthKey;
  }

  // Generate readable label (e.g., "Oct 2026" or "Current Month")
  let monthLabel = 'This Month';
  if (activeMonthKey) {
    const [y, m] = activeMonthKey.split('-');
    const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    if (!isNaN(d.getTime())) {
      monthLabel = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    }
  }

  const isVip = monthlySpend >= threshold || (customer.isVip ?? false);
  const progressPercent = Math.min(100, Math.round((monthlySpend / threshold) * 100));
  const remainingForVip = Math.max(0, threshold - monthlySpend);

  const lifetimeSpend = custSales.reduce((sum, s) => sum + s.grandTotal, 0) || customer.totalSpend || 0;
  const totalOrders = custSales.length || customer.totalVisits || 0;
  const totalGarments = custSales.reduce(
    (acc, s) => acc + s.items.reduce((iAcc, item) => iAcc + item.qty, 0),
    0
  );
  const averageOrderValue = totalOrders > 0 ? Math.round(lifetimeSpend / totalOrders) : 0;

  return {
    monthlySpend,
    monthLabel,
    isVip,
    vipThreshold: threshold,
    progressPercent,
    remainingForVip,
    lifetimeSpend,
    totalOrders,
    totalGarments,
    averageOrderValue,
    recentSales: custSales,
  };
}

/**
 * Constructs a pre-formatted WhatsApp customer ledger summary message.
 */
export function buildCustomerWhatsAppSummary(
  customer: Customer,
  metrics: CustomerSpendMetrics
): string {
  const vipText = metrics.isVip ? '👑 *VIP Status:* Active Member' : 'Tier: Valued Retail Shopper';
  const text = `*Customer Statement - Garment OS Retail*
Dear ${customer.name},
Thank you for shopping with us! Here is your current purchase summary:

${vipText}
• *Monthly Purchases (${metrics.monthLabel}):* ₹${metrics.monthlySpend.toLocaleString('en-IN')}
• *Total Lifetime Orders:* ${metrics.totalOrders} bills (${metrics.totalGarments} garments)
• *Lifetime Spend:* ₹${metrics.lifetimeSpend.toLocaleString('en-IN')}
• *Reward Points:* ${customer.loyaltyPoints} pts (Worth ₹${customer.loyaltyPoints})

Visit us soon at Garment OS!`;

  return encodeURIComponent(text);
}

/**
 * Automatically infers the reciprocal relation when linking family members.
 * E.g., Vikram links Priya as Spouse -> Priya's reciprocal relation is Spouse.
 * Vikram links Aarav as Son -> Aarav's reciprocal relation is Parent.
 */
export function getReciprocalRelation(relation: string): string {
  switch (relation) {
    case 'Spouse':
      return 'Spouse';
    case 'Son':
    case 'Daughter':
      return 'Parent';
    case 'Father':
    case 'Mother':
      return 'Child';
    case 'Brother':
    case 'Sister':
      return 'Sibling';
    case 'Grandfather':
    case 'Grandmother':
      return 'Grandchild';
    case 'In-Law':
      return 'In-Law';
    default:
      return 'Family';
  }
}

/**
 * Checks if a date (YYYY-MM-DD) has an upcoming anniversary or birthday
 * within the specified day threshold (default 30 days).
 */
export function isUpcomingMilestone(dateStr?: string, daysWindow: number = 30): boolean {
  if (!dateStr) return false;
  const parts = dateStr.split('-');
  if (parts.length < 2) return false;
  const month = parseInt(parts[parts.length - 2], 10);
  const day = parseInt(parts[parts.length - 1], 10);
  if (isNaN(month) || isNaN(day)) return false;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const currentYear = now.getFullYear();

  const thisYearDate = new Date(currentYear, month - 1, day);
  const diffDays = Math.ceil((thisYearDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays >= 0 && diffDays <= daysWindow) {
    return true;
  }

  const nextYearDate = new Date(currentYear + 1, month - 1, day);
  const nextYearDiff = Math.ceil((nextYearDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return nextYearDiff >= 0 && nextYearDiff <= daysWindow;
}

