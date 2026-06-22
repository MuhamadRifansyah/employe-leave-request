export function serialize<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj } as Record<string, unknown>;
  for (const key in result) {
    if (result[key] instanceof Date) {
      result[key] = (result[key] as Date).toISOString();
    }
  }
  return result as T;
}

export function serializeArray<T extends Record<string, unknown>>(arr: T[]): T[] {
  return arr.map(serialize);
}
