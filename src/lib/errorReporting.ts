import { trackEvent } from "@/lib/analytics";

export interface ClientErrorReport {
  message: string;
  stack?: string;
  path: string;
  createdAt: string;
  context?: string;
}

const ERROR_KEY = "blink-and-find-error-reports";
const MAX_ERRORS = 40;

export function loadErrorReports(): ClientErrorReport[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(ERROR_KEY);
    return rawValue ? JSON.parse(rawValue) as ClientErrorReport[] : [];
  } catch {
    return [];
  }
}

export function clearErrorReports() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(ERROR_KEY);
  }
}

export function reportClientError(error: unknown, context?: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const report: ClientErrorReport = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    path: window.location.pathname,
    createdAt: new Date().toISOString(),
    context,
  };

  const reports = [...loadErrorReports(), report].slice(-MAX_ERRORS);
  window.localStorage.setItem(ERROR_KEY, JSON.stringify(reports));
  trackEvent("error_reported", { context: context ?? null, message: report.message.slice(0, 140) });

  return report;
}
