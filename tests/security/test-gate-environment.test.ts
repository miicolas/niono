import { describe, expect, test } from "bun:test";

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "::1", "[::1]", "localhost"]);

describe("environnement de test hermétique", () => {
  test("ne charge aucun fichier .env réel", () => {
    expect(process.env.DOTENV_CONFIG_PATH).toBe("/dev/null");
    expect(process.env.BETTER_AUTH_SECRET).toBe(
      "test-gate-secret-at-least-32-characters"
    );
    expect(process.env.RESEND_API_KEY).toBeUndefined();
  });

  test("ne cible que des services en boucle locale", () => {
    for (const key of ["DATABASE_URL", "TEST_DATABASE_URL"]) {
      const value = process.env[key];
      expect(value).toBeDefined();
      expect(LOOPBACK_HOSTS.has(new URL(value ?? "").hostname)).toBe(true);
    }
  });
});
