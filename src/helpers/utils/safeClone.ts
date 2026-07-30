// Returns true only for plain "{}"-style objects, not class instances such as
// BSON ObjectId, Date, Buffer, etc.
const isPlainObject = (value: any): boolean => {
  if (Object.prototype.toString.call(value) !== "[object Object]") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
};

// Deep clones plain objects/arrays so mutations to the copy don't affect the
// original. Non-plain objects (e.g. Mongo ObjectId, Date, Buffer, class
// instances) are returned by reference instead of being cloned, since both
// structuredClone() and lodash's cloneDeep() are unreliable at preserving
// their prototype/behaviour.
export function safeClone<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => safeClone(item)) as unknown as T;
  }

  if (value !== null && typeof value === "object" && isPlainObject(value)) {
    const cloned: any = {};
    for (const key of Object.keys(value as any)) {
      cloned[key] = safeClone((value as any)[key]);
    }
    return cloned;
  }

  return value;
}
