import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "::1", "[::1]", "localhost"]);

const SYSTEM_ENVIRONMENT_KEYS = [
  "CI",
  "FORCE_COLOR",
  "LANG",
  "LC_ALL",
  "NO_COLOR",
  "TERM",
  "TZ",
] as const;

/** Seules ces URL de services locaux traversent la barrière, et uniquement vers une boucle locale. */
const LOCAL_SERVICE_URL_KEYS = [
  "DATABASE_URL",
  "TEST_DATABASE_URL",
  "SMOKE_URL",
  "MAILPIT_URL",
] as const;

const LOCAL_DATABASE_URL = "postgresql://digipm:digipm@127.0.0.1:55438/digipm";

function requireLoopbackUrl(name: string, value: string): string {
  const url = new URL(value);
  if (!LOOPBACK_HOSTS.has(url.hostname)) {
    throw new Error(`${name} must target a loopback service during tests`);
  }
  return value;
}

/** Environnement hermétique des tests : aucun secret réel, seulement des placeholders et des services locaux. */
export function createHermeticTestEnvironment(
  source: NodeJS.ProcessEnv
): Record<string, string> {
  const scratch = join(tmpdir(), "digipm-tests");
  const environment: Record<string, string> = {
    ASSET_DIR: join(scratch, "assets"),
    BETTER_AUTH_SECRET: "test-gate-secret-at-least-32-characters",
    BETTER_AUTH_URL: "http://127.0.0.1:3000",
    DATABASE_URL: LOCAL_DATABASE_URL,
    DOTENV_CONFIG_PATH: "/dev/null",
    EMAIL_FROM: "DigiPM tests <tests@example.test>",
    EMAIL_OUTBOX_DIR: join(scratch, "outbox"),
    NODE_ENV: "testing",
    PATH: [
      dirname(process.execPath),
      "/opt/homebrew/bin",
      "/usr/local/bin",
      "/usr/bin",
      "/bin",
      "/usr/sbin",
      "/sbin",
    ].join(delimiter),
    TEST_DATABASE_URL: LOCAL_DATABASE_URL,
    TMPDIR: tmpdir(),
  };

  for (const key of SYSTEM_ENVIRONMENT_KEYS) {
    const value = source[key];
    if (value !== undefined) {
      environment[key] = value;
    }
  }

  for (const key of LOCAL_SERVICE_URL_KEYS) {
    const value = source[key];
    if (value !== undefined) {
      environment[key] = requireLoopbackUrl(key, value);
    }
  }

  return environment;
}
