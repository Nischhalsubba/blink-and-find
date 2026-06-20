"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { clearAnalyticsEvents, loadAnalyticsEvents, type AnalyticsEvent } from "@/lib/analytics";
import { clearErrorReports, loadErrorReports, type ClientErrorReport } from "@/lib/errorReporting";

export default function TelemetryDashboard() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [errors, setErrors] = useState<ClientErrorReport[]>([]);

  function refresh() {
    setEvents(loadAnalyticsEvents().slice().reverse());
    setErrors(loadErrorReports().slice().reverse());
  }

  useEffect(() => {
    refresh();
  }, []);

  function clearAll() {
    clearAnalyticsEvents();
    clearErrorReports();
    refresh();
  }

  return (
    <main className="app-shell overflow-auto">
      <section className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-4 px-2 py-4">
        <Card className="overflow-hidden text-center">
          <CardHeader className="border-b">
            <Badge variant="secondary" className="mx-auto mb-3 w-fit">Telemetry</Badge>
            <CardTitle className="text-4xl font-semibold tracking-tight sm:text-6xl">Local analytics</CardTitle>
            <CardDescription>
              Page views, key events, and client errors are saved locally for QA. No surveillance circus needed.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent analytics events</CardTitle>
              <CardDescription>{events.length} event{events.length === 1 ? "" : "s"} stored on this device.</CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">No events yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.slice(0, 20).map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{event.name}</TableCell>
                        <TableCell>{event.path}</TableCell>
                        <TableCell>{new Date(event.createdAt).toLocaleTimeString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Client error reports</CardTitle>
              <CardDescription>{errors.length} error{errors.length === 1 ? "" : "s"} stored on this device.</CardDescription>
            </CardHeader>
            <CardContent>
              {errors.length === 0 ? (
                <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">No errors caught yet. Suspiciously civilized.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Message</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead>Context</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errors.slice(0, 20).map((error) => (
                      <TableRow key={`${error.createdAt}-${error.message}`}>
                        <TableCell>{error.message}</TableCell>
                        <TableCell>{error.path}</TableCell>
                        <TableCell>{error.context ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardFooter className="flex flex-col gap-2 p-4 sm:flex-row sm:justify-between">
            <Button asChild variant="outline"><Link href="/">Back Home</Link></Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={clearAll}>Clear Local Logs</Button>
              <Button onClick={refresh}>Refresh</Button>
            </div>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
