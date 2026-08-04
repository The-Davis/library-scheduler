export function formatTime(hour24: number): string {
  const h = hour24 % 12 || 12;
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  return `${h}:00 ${ampm}`;
}
