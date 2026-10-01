import { describe, expect, it } from "vitest";
import { detectInstallPlatform } from "./install-prompt";

const agents = {
  iphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1",
  safariMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Safari/605.1.15",
  chromeMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  edgeWindows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0",
  firefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0",
};

describe("detectInstallPlatform", () => {
  it("reconnaît les navigateurs qui demandent une installation manuelle", () => {
    expect(detectInstallPlatform(agents.iphone)).toBe("ios");
    expect(detectInstallPlatform(agents.safariMac)).toBe("safari-mac");
    expect(detectInstallPlatform(agents.firefox)).toBe("firefox");
  });

  it("laisse Chrome et Edge au cas général", () => {
    expect(detectInstallPlatform(agents.chromeMac)).toBe("other");
    expect(detectInstallPlatform(agents.edgeWindows)).toBe("other");
  });
});
