// 台灣國定假日資料 (2024-2027)
// 農曆節日已換算為國曆固定日期

export interface TaiwanHoliday {
  date: string; // YYYY-MM-DD
  name: string;
}

const holidays: TaiwanHoliday[] = [
  // 2024
  { date: "2024-01-01", name: "元旦" },
  { date: "2024-02-08", name: "除夕" },
  { date: "2024-02-09", name: "春節" },
  { date: "2024-02-10", name: "春節" },
  { date: "2024-02-11", name: "春節" },
  { date: "2024-02-12", name: "春節" },
  { date: "2024-02-28", name: "和平紀念日" },
  { date: "2024-04-04", name: "兒童節" },
  { date: "2024-04-05", name: "清明節" },
  { date: "2024-06-10", name: "端午節" },
  { date: "2024-09-17", name: "中秋節" },
  { date: "2024-10-10", name: "國慶日" },

  // 2025
  { date: "2025-01-01", name: "元旦" },
  { date: "2025-01-27", name: "除夕" },
  { date: "2025-01-28", name: "春節" },
  { date: "2025-01-29", name: "春節" },
  { date: "2025-01-30", name: "春節" },
  { date: "2025-01-31", name: "春節" },
  { date: "2025-02-28", name: "和平紀念日" },
  { date: "2025-04-03", name: "兒童節" },
  { date: "2025-04-04", name: "清明節" },
  { date: "2025-05-31", name: "端午節" },
  { date: "2025-10-06", name: "中秋節" },
  { date: "2025-10-10", name: "國慶日" },

  // 2026
  { date: "2026-01-01", name: "元旦" },
  { date: "2026-02-16", name: "除夕" },
  { date: "2026-02-17", name: "春節" },
  { date: "2026-02-18", name: "春節" },
  { date: "2026-02-19", name: "春節" },
  { date: "2026-02-20", name: "春節" },
  { date: "2026-02-28", name: "和平紀念日" },
  { date: "2026-04-04", name: "兒童節" },
  { date: "2026-04-05", name: "清明節" },
  { date: "2026-06-19", name: "端午節" },
  { date: "2026-09-25", name: "中秋節" },
  { date: "2026-10-10", name: "國慶日" },

  // 2027
  { date: "2027-01-01", name: "元旦" },
  { date: "2027-02-05", name: "除夕" },
  { date: "2027-02-06", name: "春節" },
  { date: "2027-02-07", name: "春節" },
  { date: "2027-02-08", name: "春節" },
  { date: "2027-02-09", name: "春節" },
  { date: "2027-02-28", name: "和平紀念日" },
  { date: "2027-04-04", name: "兒童節" },
  { date: "2027-04-05", name: "清明節" },
  { date: "2027-06-09", name: "端午節" },
  { date: "2027-10-10", name: "國慶日" },
  { date: "2027-10-15", name: "中秋節" },
];

const holidayMap = new Map<string, string>();
holidays.forEach((h) => holidayMap.set(h.date, h.name));

export function getHolidayName(dateStr: string): string | undefined {
  return holidayMap.get(dateStr);
}

export function isHoliday(dateStr: string): boolean {
  return holidayMap.has(dateStr);
}
