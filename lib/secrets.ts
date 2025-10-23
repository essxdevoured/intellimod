import { randomBytes } from "crypto";

export function generateSecretKey() {
  return `ims_${randomBytes(24).toString("hex")}`;
}

export function buildSecretPreview(secret: string) {
  if (secret.length <= 8) return secret;
  return `${secret.slice(0, 4)}…${secret.slice(-4)}`;
}
