const replacer = (_key: string, value: unknown) => {
  if (typeof value === "bigint") {
    return { __type: "BigInt", value: value.toString() };
  }
  if (value instanceof Map) {
    return { __type: "Map", value: Array.from(value.entries()) };
  }
  return value;
};

const reviver = (_key: string, value: unknown) => {
  if (value && typeof value === "object" && "__type" in value) {
    const tagged = value as { __type: string; value: unknown };

    if (tagged.__type === "BigInt") {
      return BigInt(tagged.value as string);
    }
    if (tagged.__type === "Map") {
      return new Map(tagged.value as [unknown, unknown][]);
    }
  }
  return value;
};

export const serialize = (value: unknown) => JSON.stringify(value, replacer);

export const deserialize = <T>(text: string): T =>
  JSON.parse(text, reviver) as T;
