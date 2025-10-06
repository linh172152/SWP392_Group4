/**
 * Generate unique booking code
 * Format: BS + YYMMDD + Random(4 chars)
 * Example: BS240106A3F2
 */
export const generateBookingCode = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const randomChars = Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase();

  return `BS${year}${month}${day}${randomChars}`;
};

/**
 * Generate battery code
 * Format: BAT + Serial (6 chars)
 * Example: BAT001234
 */
export const generateBatteryCode = (serial: number): string => {
  return `BAT${String(serial).padStart(6, '0')}`;
};

