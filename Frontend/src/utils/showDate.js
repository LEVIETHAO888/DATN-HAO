/** Local calendar date as YYYY-MM-DD (VN timezone via browser local). */
export function toLocalYmd(d) {
  const x = d instanceof Date ? d : new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isSameLocalDay(isoOrDate, ymd) {
  if (!isoOrDate || !ymd) {
    return false;
  }
  return toLocalYmd(new Date(isoOrDate)) === ymd;
}

/** Seven consecutive calendar days starting from `from` (local midnight). */
export function getNextSevenDays(from = new Date()) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}
