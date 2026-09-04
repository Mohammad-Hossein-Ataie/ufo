import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { OtpChallenge } from "@ufo/auth";

interface OtpStore {
  challenges: OtpChallenge[];
}

function findWorkspaceRoot(start = process.cwd()): string {
  let current = resolve(start);
  while (true) {
    if (existsSync(join(current, "turbo.json"))) return current;
    const parent = dirname(current);
    if (parent === current) return resolve(start);
    current = parent;
  }
}

function storePath(): string {
  return resolve(
    process.env.UFO_MOCK_DATA_DIR ?? join(findWorkspaceRoot(), "mock-data"),
    "otp-challenges.json",
  );
}

function readStore(): OtpStore {
  const path = storePath();
  if (!existsSync(path)) return { challenges: [] };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as OtpStore;
    return { challenges: Array.isArray(parsed.challenges) ? parsed.challenges : [] };
  } catch {
    return { challenges: [] };
  }
}

function writeStore(store: OtpStore): void {
  const path = storePath();
  mkdirSync(dirname(path), { recursive: true });
  const tempPath = `${path}.${Date.now()}.tmp`;
  writeFileSync(tempPath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  if (existsSync(path)) rmSync(path, { force: true });
  renameSync(tempPath, path);
}

export function saveOtpChallenge(challenge: OtpChallenge): void {
  const store = readStore();
  const now = new Date().toISOString();
  writeStore({
    challenges: [
      challenge,
      ...store.challenges.filter((item) => item.phone !== challenge.phone && item.expiresAt > now),
    ],
  });
}

export function getOtpChallenge(challengeId: string): OtpChallenge | undefined {
  return readStore().challenges.find((challenge) => challenge.id === challengeId);
}

export function updateOtpChallenge(challenge: OtpChallenge): void {
  const store = readStore();
  writeStore({
    challenges: store.challenges.map((item) => (item.id === challenge.id ? challenge : item)),
  });
}

export function removeOtpChallenge(challengeId: string): void {
  const store = readStore();
  writeStore({ challenges: store.challenges.filter((item) => item.id !== challengeId) });
}
