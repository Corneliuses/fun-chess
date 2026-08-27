// PawnParty was written for an environment that provides a `window.storage`
// key-value API. Back it with localStorage when that API isn't present.
if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    async get(key) {
      const value = localStorage.getItem(key);
      return value === null ? null : { value };
    },
    async set(key, value) {
      localStorage.setItem(key, value);
    },
  };
}
