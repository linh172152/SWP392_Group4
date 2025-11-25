/**
 * Safely convert Prisma Decimal to number
 * Handles both Decimal objects and plain numbers
 */
export function decimalToNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }

  // If it's already a number, return it
  if (typeof value === "number") {
    return value;
  }

  // If it's a Prisma Decimal object with toNumber method
  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as any).toNumber === "function"
  ) {
    return (value as any).toNumber();
  }

  // Try to convert to number
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return 0;
  }

  return num;
}

/**
 * Safely get toNumber() from Decimal if available, otherwise use Number()
 */
export function safeToNumber(value: unknown): number {
  if (value === null || value === undefined) {
    throw new Error("Value is null or undefined");
  }

  if (typeof value === "number") {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as any).toNumber === "function"
  ) {
    return (value as any).toNumber();
  }

  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error("Value cannot be converted to a finite number");
  }

  return num;
}
