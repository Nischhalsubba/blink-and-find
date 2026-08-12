"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { reportClientError } from "@/lib/errorReporting";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void reportClientError(error, "app_error_boundary");
  }, [error]);

  return (
    <main className="app-shell">
      <section className="flex min-h-full items-center justify-center px-3 py-8">
        <Card className="w-full max-w-xl overflow-hidden rounded-[1.8rem]">
          <CardHeader className="border-b text-center">
            <CardTitle className="text-3xl font-black tracking-[-0.04em]">The game hit an error</CardTitle>
            <CardDescription>
              I logged this crash so it can be fixed instead of haunting the app like a tiny JavaScript ghost.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-5 text-sm text-muted-foreground">
            <div className="rounded-2xl border bg-muted/20 p-3">
              <div className="font-black text-slate-950">Error</div>
              <div className="mt-1 break-words">{error.message || "Unknown app error"}</div>
            </div>
            {error.digest && (
              <div className="rounded-2xl border bg-muted/20 p-3">
                <div className="font-black text-slate-950">Digest</div>
                <div className="mt-1 break-words">{error.digest}</div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col-reverse gap-2 border-t p-5 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => { window.location.href = "/"; }}>Back Home</Button>
            <Button onClick={reset}>Try Again</Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
