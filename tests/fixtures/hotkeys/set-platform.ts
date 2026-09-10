import { vi } from "vitest";

export function setPlatform(platform: string) {
  vi.spyOn(window.navigator, "platform", "get").mockReturnValue(platform);
  vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue(platform);
}
