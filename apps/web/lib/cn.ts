export type ClassValue = string | number | null | false | undefined;

export const cn = (...values: ClassValue[]) => values.filter(Boolean).join(" ");
