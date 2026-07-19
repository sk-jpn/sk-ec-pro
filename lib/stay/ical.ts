import "server-only";

export type IcalBlockedPeriod = {
  uid: string;
  startDate: string;
  endDate: string;
  summary: string;
};

function unescapeIcal(value: string) {
  return value.replaceAll("\\n", " ").replaceAll("\\,", ",").replaceAll("\\;", ";").replaceAll("\\\\", "\\").trim();
}

function dateValue(value: string) {
  const raw = value.trim();
  const match = raw.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

export function parseIcalBlockedPeriods(source: string): IcalBlockedPeriod[] {
  const unfolded = source.replace(/\r?\n[ \t]/g, "");
  const events = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) ?? [];
  const result: IcalBlockedPeriod[] = [];

  for (const event of events) {
    const values = new Map<string, string>();
    for (const line of event.split(/\r?\n/)) {
      const separator = line.indexOf(":");
      if (separator < 0) continue;
      const key = line.slice(0, separator).split(";", 1)[0].toUpperCase();
      values.set(key, line.slice(separator + 1));
    }
    const startDate = dateValue(values.get("DTSTART") ?? "");
    const endDate = dateValue(values.get("DTEND") ?? "");
    const uid = unescapeIcal(values.get("UID") ?? "");
    if (!uid || !startDate || !endDate || endDate <= startDate) continue;
    result.push({ uid: uid.slice(0, 500), startDate, endDate, summary: unescapeIcal(values.get("SUMMARY") ?? "Airbnb予約").slice(0, 200) || "Airbnb予約" });
  }
  return result;
}
