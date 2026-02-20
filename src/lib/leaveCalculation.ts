/**
 * Calculate months of service from hire date to now.
 */
export function getMonthsOfService(hireDate: string | Date): number {
  const hire = new Date(hireDate);
  const now = new Date();
  return (now.getFullYear() - hire.getFullYear()) * 12 + (now.getMonth() - hire.getMonth());
}

/**
 * Given months of service and annual_leave_rules, calculate annual leave days.
 * For 10+ years (120+ months), base is 15 days + 1 per extra year, max 30.
 */
export function calculateAnnualLeaveDays(
  monthsOfService: number,
  rules: { min_months: number; max_months: number | null; days: number }[]
): number {
  if (monthsOfService < 6) return 0;

  // Sort rules by min_months ascending
  const sorted = [...rules].sort((a, b) => a.min_months - b.min_months);

  for (const rule of sorted) {
    if (rule.max_months === null) {
      // 10+ years: base days + 1 per extra year beyond 10, max 30
      const extraYears = Math.floor((monthsOfService - rule.min_months) / 12);
      return Math.min(rule.days + extraYears, 30);
    }
    if (monthsOfService >= rule.min_months && monthsOfService < rule.max_months) {
      return rule.days;
    }
  }

  return 0;
}
