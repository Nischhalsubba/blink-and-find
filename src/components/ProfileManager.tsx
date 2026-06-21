"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPlayerProfile, resetPlayerProfile, savePlayerProfile, syncPlayerProfile, type PlayerProfile } from "@/lib/playerProfile";

export default function ProfileManager() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [name, setName] = useState("Player");
  const [message, setMessage] = useState("Your profile is saved locally in this browser. No account ceremony required. Humanity survives.");
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const current = getPlayerProfile();
    setProfile(current);
    setName(current.name);
  }, []);

  function saveProfile() {
    const nextProfile = savePlayerProfile({ name });
    setProfile(nextProfile);
    setName(nextProfile.name);
    setMessage("Profile saved on this device.");
  }

  async function syncProfile() {
    const nextProfile = savePlayerProfile({ name });
    setProfile(nextProfile);
    setName(nextProfile.name);
    setIsSyncing(true);

    try {
      const result = await syncPlayerProfile(nextProfile);
      setMessage(result.synced ? "Profile synced to Supabase." : "Profile saved locally. Run the production Supabase migration to enable cloud sync.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sync profile.");
    } finally {
      setIsSyncing(false);
    }
  }

  function resetProfile() {
    const nextProfile = resetPlayerProfile();
    setProfile(nextProfile);
    setName(nextProfile.name);
    setMessage("Profile reset. A fresh identity, without the paperwork.");
  }

  return (
    <main className="app-shell overflow-auto">
      <section className="mx-auto flex min-h-full w-full max-w-3xl items-center justify-center px-2 py-4">
        <Card className="w-full overflow-hidden">
          <CardHeader className="border-b text-center">
            <Badge variant="secondary" className="mx-auto mb-3 w-fit">Profile</Badge>
            <CardTitle className="text-4xl font-semibold tracking-tight sm:text-6xl">Player profile</CardTitle>
            <CardDescription>
              This lightweight profile powers local stats, analytics, leaderboard submissions, and optional Supabase sync.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 p-4 sm:p-6">
            <div className="grid gap-2">
              <Label htmlFor="profile-name">Display name</Label>
              <Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={32} />
            </div>

            <div className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground" role="status">
              {message}
            </div>

            {profile && (
              <div className="grid gap-2 rounded-xl border bg-muted/20 p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Player ID</span>
                  <code className="break-all text-right text-xs">{profile.id}</code>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(profile.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{new Date(profile.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-2 border-t p-4 sm:flex-row sm:justify-between sm:p-6">
            <Button asChild variant="outline"><Link href="/">Back Home</Link></Button>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={resetProfile}>Reset</Button>
              <Button variant="outline" onClick={syncProfile} disabled={isSyncing}>{isSyncing ? "Syncing..." : "Sync Profile"}</Button>
              <Button onClick={saveProfile}>Save Profile</Button>
            </div>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
