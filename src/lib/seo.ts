export const SITE_URL = "https://blink-and-find.hinischalsubba.workers.dev";

export const SITE_NAME = "Blink & Find";

export const SITE_TITLE = "Blink & Find | Free Online Number Hunting Memory Game";

export const SITE_DESCRIPTION =
  "Play Blink & Find, a free online number hunting memory game. Memorize a target number, find it on a scattered board, train focus, and race friends in Same Challenge or Live Race mode.";

export const RULES_DESCRIPTION =
  "Learn how to play Blink & Find, including target preview, scoring, penalties, Same Challenge, Live Race, online rooms, and winning rules.";

export const TUTORIAL_DESCRIPTION =
  "Try a quick interactive Blink & Find tutorial. Memorize the target, tap the matching number, and learn how wrong-tap penalties work before starting a real game.";

export const PRACTICE_DESCRIPTION =
  "Practice Blink & Find without timer pressure. Pick a difficulty, find targets at your own pace, use hints, and build confidence before a real game.";

export const DAILY_DESCRIPTION =
  "Play today's Blink & Find Daily Challenge. Everyone gets the same target and scattered board, so you can compare times fairly.";

export const TIME_ATTACK_DESCRIPTION =
  "Play Blink & Find Time Attack, a 60-second number hunting sprint where you find as many targets as possible before the clock runs out.";

export const STREAK_DESCRIPTION =
  "Play Blink & Find Streak Mode. Keep finding hidden target numbers until one wrong tap ends the run.";

export const STATS_DESCRIPTION =
  "View your Blink & Find personal stats, local best scores, practice rounds, daily challenge results, streak bests, and achievements.";

export const CHALLENGE_DESCRIPTION =
  "Play a shared Blink & Find challenge link with the same seeded board and target as your friends.";

export const COMFORT_DESCRIPTION =
  "Play Blink & Find Comfort Mode with a smaller board, larger tiles, longer preview, and gentler penalties for kids, seniors, and first-time players.";

export const ZEN_DESCRIPTION =
  "Play Blink & Find Zen Mode with endless calm boards, visible targets, no timer, and no score pressure.";

export const TIPS_DESCRIPTION =
  "Improve at Blink & Find with practical scanning, memory, focus, and speed tips for number hunting games.";

export const MODES_DESCRIPTION =
  "Explore every Blink & Find game mode, including Practice, Daily Challenge, Time Attack, Streak, Comfort, Zen, Same Challenge, and Live Race.";

export const FAQ_DESCRIPTION =
  "Read answers to common Blink & Find questions about scoring, wrong taps, saved stats, Daily Challenge, online rooms, and game modes.";

export const LEADERBOARD_DESCRIPTION =
  "Compare Blink & Find scores on local and global leaderboards for classic number hunting games.";

export const PROFILE_DESCRIPTION =
  "Manage your Blink & Find player profile for local stats, analytics, and leaderboard submissions.";

export const SEO_KEYWORDS = [
  "Blink and Find",
  "Blink & Find",
  "number hunting game",
  "memory game online",
  "free memory game",
  "reaction game",
  "focus training game",
  "brain training game",
  "online number game",
  "multiplayer browser game",
  "free web game",
  "find the number game",
  "same challenge game",
  "live race game",
  "visual memory game",
  "attention game",
  "daily memory challenge",
  "daily brain game",
  "time attack game",
  "streak mode game",
  "memory game stats",
  "accessible memory game",
  "shared challenge game",
  "focus tips",
  "game leaderboard",
];

export const ROUTES = [
  {
    path: "/",
    label: "Play Blink & Find",
    description: "Start a quick number hunting game or create an online room for friends.",
  },
  {
    path: "/daily",
    label: "Daily Challenge",
    description: DAILY_DESCRIPTION,
  },
  {
    path: "/challenge",
    label: "Shared Challenge",
    description: CHALLENGE_DESCRIPTION,
  },
  {
    path: "/time-attack",
    label: "Time Attack",
    description: TIME_ATTACK_DESCRIPTION,
  },
  {
    path: "/streak",
    label: "Streak Mode",
    description: STREAK_DESCRIPTION,
  },
  {
    path: "/comfort",
    label: "Comfort Mode",
    description: COMFORT_DESCRIPTION,
  },
  {
    path: "/zen",
    label: "Zen Mode",
    description: ZEN_DESCRIPTION,
  },
  {
    path: "/tutorial",
    label: "Interactive Tutorial",
    description: TUTORIAL_DESCRIPTION,
  },
  {
    path: "/practice",
    label: "Practice Mode",
    description: PRACTICE_DESCRIPTION,
  },
  {
    path: "/stats",
    label: "Personal Stats",
    description: STATS_DESCRIPTION,
  },
  {
    path: "/leaderboard",
    label: "Leaderboard",
    description: LEADERBOARD_DESCRIPTION,
  },
  {
    path: "/profile",
    label: "Player Profile",
    description: PROFILE_DESCRIPTION,
  },
  {
    path: "/tips",
    label: "Tips",
    description: TIPS_DESCRIPTION,
  },
  {
    path: "/modes",
    label: "Game Modes",
    description: MODES_DESCRIPTION,
  },
  {
    path: "/faq",
    label: "FAQ",
    description: FAQ_DESCRIPTION,
  },
  {
    path: "/rules",
    label: "Game Rules",
    description: RULES_DESCRIPTION,
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
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": ["VideoGame", "WebApplication"],
        "@id": `${SITE_URL}/#game`,
        name: SITE_NAME,
        alternateName: "Blink and Find",
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        applicationCategory: "GameApplication",
        genre: ["Memory", "Puzzle", "Reaction", "Educational", "Brain Training"],
        operatingSystem: "Any modern web browser",
        browserRequirements: "Requires JavaScript and a modern browser",
        playMode: ["SinglePlayer", "MultiPlayer"],
        numberOfPlayers: "1-4 local players or online friends",
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
      {
        "@type": "HowTo",
        "@id": `${SITE_URL}/rules#how-to-play`,
        name: "How to play Blink & Find",
        description: RULES_DESCRIPTION,
        step: [
          {
            "@type": "HowToStep",
            name: "Memorize the target",
            text: "A target number appears briefly before the round starts.",
          },
          {
            "@type": "HowToStep",
            name: "Find the hidden number",
            text: "After the target hides, tap the matching number on the scattered board.",
          },
          {
            "@type": "HowToStep",
            name: "Avoid wrong taps",
            text: "Each wrong tap adds penalty time to your score.",
          },
          {
            "@type": "HowToStep",
            name: "Win by fastest total time",
            text: "The player with the lowest total time after all rounds wins.",
          },
        ],
      },
    ],
  };
}
