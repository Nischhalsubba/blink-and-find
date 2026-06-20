"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { reportClientError } from "@/lib/errorReporting";

export default function AppTelemetry() {
  const pathname = usePathname();

  useEffect(() => {
    trackEvent("page_view", { path: pathname });
  }, [pathname]);

  useEffect(() => {
    function handleError(event: ErrorEvent) {
      reportClientError(event.error ?? event.message, "window.error");
    }

    function handleRejection(event: PromiseRejectionEvent) {
      reportClientError(event.reason, "unhandledrejection");
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
