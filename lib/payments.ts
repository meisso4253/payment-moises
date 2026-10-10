export const PRICE = 4900;
export const DAYS = 120;
export function checkedText(value: unknown, max: number, label: string) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new Error(`Enter a valid ${label}.`);
  return value.trim();
}
export function referenceKey(value: unknown) {
  const v=checkedText(value,50,'GCash reference number').toUpperCase();
  if (!/^[A-Z0-9-]{6,50}$/.test(v)) throw new Error('Use 6–50 letters, numbers, or hyphens for the GCash reference.');
  return v;
}
export function proofType(bytes: Uint8Array) {
  if(bytes[0]===137 && bytes[1]===80 && bytes[2]===78 && bytes[3]===71 && bytes[4]===13 && bytes[5]===10 && bytes[6]===26 && bytes[7]===10) return 'image/png';
  if(bytes[0]===255 && bytes[1]===216 && bytes[2]===255) return 'image/jpeg';
  return null;
}
export function paidDate(value: unknown) {
  const v=checkedText(value,10,'payment date');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v+'T00:00:00+08:00')) || new Date(v+'T00:00:00+08:00').toLocaleDateString('en-CA',{timeZone:'Asia/Manila'})!==v) throw new Error('Enter a valid payment date.');
  if(Date.parse(v+'T00:00:00+08:00')>Date.now()) throw new Error('The payment date cannot be in the future.');
  return v;
}
