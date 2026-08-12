import { clearAppLogs, loadAppLogs, reportAppError, type StoredAppLog } from "@/lib/appLogger";

export interface ClientErrorReport {
  message: string;
  stack?: string;
  path: string;
  createdAt: string;
  context?: string;
}

function toClientErrorReport(log: StoredAppLog): ClientErrorReport {
  const error = log.metadata.error as { stack?: string } | undefined;

  return {
    message: log.message ?? log.eventName,
    stack: typeof error?.stack === "string" ? error.stack : undefined,
    path: log.path,
    createdAt: log.createdAt,
    context: log.eventName,
  };
}

export function loadErrorReports(): ClientErrorReport[] {
  return loadAppLogs()
    .filter((log) => log.level === "error")
    .map(toClientErrorReport);
}

export function clearErrorReports() {
  clearAppLogs();
}

export function reportClientError(error: unknown, context?: string) {
  return reportAppError(error, context ?? "client_error");
}
