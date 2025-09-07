export function formatDate(d?: string | null) {
    if (!d) return "-";
    try {
      // รองรับทั้ง "YYYY-MM-DD HH:mm:ss" และ ISO
      const iso = d.includes("T") ? d : d.replace(" ", "T");
      return new Date(iso).toLocaleString("th-TH");
    } catch {
      return d;
    }
  }