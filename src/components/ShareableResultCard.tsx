"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { absoluteUrl } from "@/lib/seo";

export interface ShareCardMetric {
  label: string;
  value: string;
}

interface ShareableResultCardProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryValue: string;
  metrics: ShareCardMetric[];
  footer: string;
  filename: string;
  shareText: string;
  shareUrl?: string;
}

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function createShareCardSvg(props: ShareableResultCardProps) {
  const safeMetrics = props.metrics.slice(0, 4);
  const metricWidth = 248;
  const metricGap = 20;
  const metricStartX = 76;

  const metricCards = safeMetrics.map((metric, index) => {
    const x = metricStartX + index * (metricWidth + metricGap);

    return `
      <rect x="${x}" y="420" width="${metricWidth}" height="104" rx="22" fill="#18181b" stroke="#3f3f46"/>
      <text x="${x + 22}" y="458" font-size="22" fill="#a1a1aa">${escapeSvgText(metric.label)}</text>
      <text x="${x + 22}" y="500" font-size="34" font-weight="700" fill="#fafafa">${escapeSvgText(truncate(metric.value, 14))}</text>
    `;
  }).join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="Blink and Find result card">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#09090b"/>
          <stop offset="0.58" stop-color="#18181b"/>
          <stop offset="1" stop-color="#27272a"/>
        </linearGradient>
        <radialGradient id="glow" cx="0.82" cy="0.2" r="0.52">
          <stop offset="0" stop-color="#fafafa" stop-opacity="0.22"/>
          <stop offset="1" stop-color="#fafafa" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="630" rx="0" fill="url(#bg)"/>
      <rect width="1200" height="630" fill="url(#glow)"/>
      <circle cx="990" cy="120" r="74" fill="#fafafa" opacity="0.08"/>
      <circle cx="1060" cy="214" r="32" fill="#fafafa" opacity="0.10"/>
      <rect x="56" y="56" width="1088" height="518" rx="42" fill="#09090b" opacity="0.72" stroke="#3f3f46"/>
      <text x="76" y="112" font-size="24" font-weight="700" fill="#a1a1aa" letter-spacing="2">${escapeSvgText(props.eyebrow.toUpperCase())}</text>
      <text x="76" y="188" font-size="58" font-weight="800" fill="#fafafa">${escapeSvgText(truncate(props.title, 28))}</text>
      <text x="76" y="232" font-size="28" fill="#d4d4d8">${escapeSvgText(truncate(props.subtitle, 58))}</text>
      <rect x="76" y="276" width="1048" height="112" rx="28" fill="#fafafa"/>
      <text x="104" y="322" font-size="24" font-weight="700" fill="#52525b">${escapeSvgText(props.primaryLabel.toUpperCase())}</text>
      <text x="104" y="368" font-size="46" font-weight="800" fill="#09090b">${escapeSvgText(truncate(props.primaryValue, 34))}</text>
      ${metricCards}
      <text x="76" y="562" font-size="22" fill="#a1a1aa">${escapeSvgText(truncate(props.footer, 80))}</text>
      <text x="924" y="562" font-size="22" font-weight="700" fill="#fafafa">blink-and-find</text>
    </svg>
  `.trim();
}

export default function ShareableResultCard(props: ShareableResultCardProps) {
  const [status, setStatus] = useState("Share your result as text or download a clean score card.");
  const shareUrl = props.shareUrl ?? absoluteUrl("/");

  function downloadCard() {
    const svg = createShareCardSvg(props);
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = props.filename.endsWith(".svg") ? props.filename : `${props.filename}.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("Score card downloaded. A tiny trophy your files app can understand.");
  }

  async function copyText() {
    if (!navigator.clipboard) {
      setStatus("Clipboard is not available in this browser.");
      return;
    }

    await navigator.clipboard.writeText(`${props.shareText} ${shareUrl}`);
    setStatus("Result text copied.");
  }

  async function shareResult() {
    if (!navigator.share) {
      await copyText();
      return;
    }

    await navigator.share({
      title: "Blink & Find result",
      text: props.shareText,
      url: shareUrl,
    });
    setStatus("Share sheet opened.");
  }

  return (
    <Card className="mt-4 overflow-hidden bg-muted/20 shadow-none">
      <CardHeader className="border-b px-4 py-4">
        <CardTitle className="text-base">Shareable result card</CardTitle>
        <CardDescription>{status}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-2xl border bg-background p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{props.eyebrow}</div>
          <div className="mt-3 text-3xl font-bold tracking-tight">{props.title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{props.subtitle}</div>
          <div className="mt-4 rounded-xl bg-primary p-3 text-primary-foreground">
            <div className="text-xs font-semibold uppercase opacity-70">{props.primaryLabel}</div>
            <div className="text-2xl font-bold">{props.primaryValue}</div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {props.metrics.slice(0, 4).map((metric) => (
              <div key={metric.label} className="rounded-xl border bg-muted/20 p-3">
                <div className="text-muted-foreground">{metric.label}</div>
                <div className="font-semibold">{metric.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">{props.footer}</div>
        </div>

        <div className="flex flex-col justify-center gap-2">
          <Button onClick={downloadCard}>Download Card</Button>
          <Button variant="outline" onClick={shareResult}>Share Result</Button>
          <Button variant="ghost" onClick={copyText}>Copy Text</Button>
        </div>
      </CardContent>
    </Card>
  );
}
