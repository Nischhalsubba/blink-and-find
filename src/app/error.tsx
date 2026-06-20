"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { reportClientError } from "@/lib/errorReporting";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError(error, "app-error-boundary");
  }, [error]);

  return (
    <main className="app-shell">
      <section className="flex h-full items-center justify-center px-3">
        <Card className="w-full max-w-xl overflow-hidden text-center">
          <CardHeader className="border-b">
            <CardTitle>Something blinked wrong</CardTitle>
            <CardDescription>
              The app caught the error and saved a local report. Tiny mercy from the machine.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 text-sm text-muted-foreground">
            {error.message || "Unknown error"}
          </CardContent>
          <CardFooter className="flex justify-center gap-2 border-t p-4">
            <Button variant="outline" onClick={() => window.location.assign("/")}>Back Home</Button>
            <Button onClick={reset}>Try Again</Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
