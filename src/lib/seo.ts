export const SITE_URL = "https://blink-and-find.hinischalsubba.workers.dev";

export const SITE_NAME = "Blink & Find";

export const SITE_DESCRIPTION =
  "Play Blink & Find, a fast number hunting memory game. Memorize a target number, find it on a scattered board, and race friends online in Same Challenge or Live Race mode.";

export const SEO_KEYWORDS = [
  "Blink and Find",
  "number hunting game",
  "memory game",
  "reaction game",
  "brain training game",
  "online number game",
  "multiplayer browser game",
  "free web game",
  "find the number game",
  "same challenge game",
  "live race game",
];

export const ROUTES = [
  {
    path: "/",
    label: "Play Blink & Find",
    description: "Start a quick number hunting game or create an online room for friends.",
  },
  {
    path: "/rules",
    label: "Game Rules",
    description: "Learn how to play, how scoring works, and what Same Challenge and Live Race mean.",
  },
  {
    path: "/online",
    label: "Online Play",
    description: "Create or join an online room to play with a friend on another device.",
  },
  {
    path: "/history",
    label: "Online History",
    description: "View completed online rooms, winners, leaderboard entries, and round results.",
  },
];

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export function getGameJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        inLanguage: "en",
      },
      {
        "@type": ["VideoGame", "WebApplication"],
        "@id": `${SITE_URL}/#game`,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        applicationCategory: "GameApplication",
        genre: ["Memory", "Puzzle", "Reaction", "Educational"],
        operatingSystem: "Any modern web browser",
        playMode: ["SinglePlayer", "MultiPlayer"],
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        publisher: {
          "@type": "Person",
          name: "Nischhal Subba",
        },
      },
    ],
  };
}
