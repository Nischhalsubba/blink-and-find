"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface InvitePanelProps {
  roomCode: string;
  inviteUrl: string;
  onMessage: (message: string) => void;
}

/**
 * Room invite helper with native share, copy fallback, and QR code.
 */
export default function InvitePanel({ roomCode, inviteUrl, onMessage }: InvitePanelProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    let isMounted = true;

    async function buildQrCode() {
      try {
        const QRCode = await import("qrcode");
        const dataUrl = await QRCode.toDataURL(inviteUrl, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 192,
        });

        if (isMounted) {
          setQrCodeUrl(dataUrl);
        }
      } catch {
        if (isMounted) {
          setQrCodeUrl("");
        }
      }
    }

    void buildQrCode();

    return () => {
      isMounted = false;
    };
  }, [inviteUrl]);

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      onMessage("Invite link copied. Send it to your friend.");
    } catch {
      onMessage(inviteUrl);
    }
  }

  async function shareInvite() {
    if (!canShare) {
      await copyInvite();
      return;
    }

    try {
      await navigator.share({
        title: "Play Blink & Find",
        text: `Join my Blink & Find room: ${roomCode}`,
        url: inviteUrl,
      });
      onMessage("Invite shared.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      await copyInvite();
    }
  }

  return (
    <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 text-center">
      <div>
        <Badge variant="secondary" className="mb-2">Invite</Badge>
        <div className="text-sm text-muted-foreground">Share this room with your friend.</div>
      </div>

      {qrCodeUrl && (
        <div className="mx-auto rounded-xl border bg-white p-2">
          <img src={qrCodeUrl} alt={`QR code for room ${roomCode}`} width={192} height={192} />
        </div>
      )}

      <div className="rounded-lg border bg-background/50 p-3">
        <div className="text-xs text-muted-foreground">Room code</div>
        <div className="text-3xl font-bold tracking-[0.3em] sm:text-4xl">{roomCode}</div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button onClick={shareInvite}>{canShare ? "Share Invite" : "Copy Invite"}</Button>
        <Button variant="outline" onClick={copyInvite}>Copy Link</Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Your friend can scan the QR, open the link, or type the code. Finally, choices that do not require a support ticket.
      </p>
    </div>
  );
}
