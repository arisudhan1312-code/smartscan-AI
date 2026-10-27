export function cn(...inputs: any[]): string {
  return inputs
    .flat()
    .filter((x) => typeof x === "string" && x.trim() !== "")
    .join(" ")
    .trim();
}

export function formatFrequency(mhz: number): string {
  return `${mhz.toFixed(1)} MHz`;
}

export function formatDbm(dbm: number): string {
  return `${dbm.toFixed(1)} dBm`;
}

export function formatNumber(val: number, decimals = 2): string {
  return val.toFixed(decimals);
}

export function formatCycle(cycle: number): string {
  return `Cycle ${cycle}`;
}
