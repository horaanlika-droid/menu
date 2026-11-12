import { chromium } from "playwright-core";
import bundledChromium, {
  inflate,
  setupLambdaEnvironment,
} from "@sparticuz/chromium";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("../", import.meta.url));
export const appUrl = process.env.APP_URL || "http://127.0.0.1:5173";

export async function launchBrowser() {
  if (process.env.CHROMIUM_PATH)
    return chromium.launch({
      executablePath: process.env.CHROMIUM_PATH,
      headless: true,
      args: ["--no-sandbox"],
    });
  // The npm package supplies the binary and the three NSS libraries absent in
  // minimal Debian sandboxes. No browser download from a third-party CDN.
  await inflate(
    path.join(root, "node_modules/@sparticuz/chromium/bin/al2023.tar.br"),
  );
  setupLambdaEnvironment("/tmp/al2023/lib");
  return chromium.launch({
    executablePath: await bundledChromium.executablePath(),
    args: bundledChromium.args,
    headless: true,
  });
}
