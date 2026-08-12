const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.SUPABASE_PROJECT_REF;

if (!accessToken || !projectRef) {
  throw new Error(
    "SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF are required to check database advisors."
  );
}

async function getAdvisors(kind) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${encodeURIComponent(projectRef)}/advisors/${kind}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const body = await response.text();
  if (!response.ok) {
    throw new Error(
      `${kind} advisor request failed with HTTP ${response.status}: ${body.slice(0, 500)}`
    );
  }

  const payload = JSON.parse(body);
  return Array.isArray(payload.lints) ? payload.lints : [];
}

function printAdvisor(kind, lint) {
  const level = String(lint.level ?? "UNKNOWN").toUpperCase();
  const name = lint.name ?? lint.title ?? "unnamed_advisor";
  const detail = lint.description ?? lint.detail ?? "No details provided.";
  console.log(`[${kind}] ${level} ${name}: ${detail}`);
}

async function main() {
  const kinds = ["security", "performance"];
  const results = await Promise.all(
    kinds.map(async (kind) => [kind, await getAdvisors(kind)])
  );

  const blocking = [];
  for (const [kind, lints] of results) {
    if (lints.length === 0) {
      console.log(`[${kind}] No advisor findings.`);
      continue;
    }

    for (const lint of lints) {
      printAdvisor(kind, lint);
      if (String(lint.level ?? "").toUpperCase() === "ERROR") {
        blocking.push({ kind, lint });
      }
    }
  }

  if (blocking.length > 0) {
    throw new Error(
      `${blocking.length} blocking Supabase advisor finding(s) must be resolved.`
    );
  }

  console.log("Supabase advisor check passed with no ERROR-level findings.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
