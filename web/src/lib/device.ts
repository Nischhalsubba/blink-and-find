const DEVICE_ID_KEY = "blink-and-find-device-id";
const DEVICE_SECRET_KEY = "blink-and-find-device-secret";

function createRandomValue(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function getDeviceId(): string {
  if (typeof window === "undefined") {
    return "server-device";
  }

  const existing = window.localStorage.getItem(DEVICE_ID_KEY);

  if (existing) {
    return existing;
  }

  const next = createRandomValue();
  window.localStorage.setItem(DEVICE_ID_KEY, next);
  return next;
}

export function getDeviceSecret(): string {
  if (typeof window === "undefined") {
    return "server-device-secret";
  }

  const existing = window.localStorage.getItem(DEVICE_SECRET_KEY);

  if (existing) {
    return existing;
  }

  const next = `${createRandomValue()}-${createRandomValue()}`;
  window.localStorage.setItem(DEVICE_SECRET_KEY, next);
  return next;
}
