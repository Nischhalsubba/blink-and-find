"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES, SITE_NAME } from "@/lib/seo";

const routeLabelByPath = new Map(ROUTES.map((route) => [route.path, route.label]));

function humanizeSegment(segment: string) {
  return decodeURIComponent(segment)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function SiteBreadcrumb() {
  const pathname = usePathname() || "/";
  const cleanPath = pathname.split("?")[0] || "/";
  const segments = cleanPath.split("/").filter(Boolean);

  const items = [
    {
      href: "/",
      label: "Home",
      current: cleanPath === "/",
    },
    ...segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`;
      return {
        href,
        label: routeLabelByPath.get(href) ?? humanizeSegment(segment),
        current: href === cleanPath,
      };
    }),
  ];

  return (
    <nav className="site-breadcrumb" aria-label={`${SITE_NAME} breadcrumb navigation`}>
      <ol>
        {items.map((item, index) => (
          <li key={item.href}>
            {index > 0 && <span className="site-breadcrumb-separator" aria-hidden="true">/</span>}
            {item.current ? (
              <span aria-current="page">{item.label}</span>
            ) : (
              <Link href={item.href}>{item.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
