export const getInfo = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: Array<K>,
): Record<K, T[K]> => {
  return keys.reduce(
    (acc, key) => {
      acc[key] = obj[key];
      return acc;
    },
    {} as Record<K, T[K]>,
  );
};

export const unSelect = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: Array<K>,
): Record<K, T[K]> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key as K)),
  ).valueOf() as Record<K, T[K]>;
};
