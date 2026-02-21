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

/**
 * Format hours into "X天 Yh" display format.
 */
export function formatHoursDisplay(totalHours: number, dailyWorkHours: number = 8): string {
  if (totalHours <= 0) return "0h";
  const days = Math.floor(totalHours / dailyWorkHours);
  const remainingHours = totalHours % dailyWorkHours;
  if (days === 0) return `${remainingHours}h`;
  if (remainingHours === 0) return `${days}天`;
  return `${days}天 ${remainingHours}h`;
}

/**
 * Generate time options in 0.5h increments (e.g. "08:00", "08:30", ..., "18:00")
 */
export function generateTimeOptions(start = 0, end = 24): string[] {
  const options: string[] = [];
  for (let h = start; h < end; h++) {
    options.push(`${String(h).padStart(2, "0")}:00`);
    options.push(`${String(h).padStart(2, "0")}:30`);
  }
  options.push(`${String(end).padStart(2, "0")}:00`);
  return options;
}

/**
 * Calculate leave hours from date range and time range.
 * For single day: difference between start_time and end_time.
 * For multi-day: first day (startTime to dayEnd) + middle full days + last day (dayStart to endTime).
 */
export function calculateLeaveHours(
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string,
  dailyWorkHours: number = 8,
  workStartTime: string = "09:00"
): number {
  const timeToHours = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h + m / 60;
  };

  const sTime = timeToHours(startTime);
  const eTime = timeToHours(endTime);

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000);

  if (diffDays === 0) {
    // Same day
    return Math.max(0, Math.round((eTime - sTime) * 2) / 2);
  }

  const workStart = timeToHours(workStartTime);
  const workEnd = workStart + dailyWorkHours;

  // First day: startTime to workEnd
  const firstDayHours = Math.max(0, Math.round((workEnd - sTime) * 2) / 2);
  // Last day: workStart to endTime
  const lastDayHours = Math.max(0, Math.round((eTime - workStart) * 2) / 2);
  // Middle days: full work days
  const middleDays = Math.max(0, diffDays - 1);

  return firstDayHours + (middleDays * dailyWorkHours) + lastDayHours;
}
