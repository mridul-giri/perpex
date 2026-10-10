import { config } from "@perpex/config";
import type { EngineUser } from "@perpex/types";
import { Users } from "../store/store";
import { insuranceFund } from "../services/insurance-fund";
import type { EngineManager } from "../services/engine-manager";
import type { EngineMarketState } from "../services/engine";
import { getObjectText, listObjects, putObject, s3Configured } from "./s3";
import { deserialize, serialize } from "./serialization";

const SNAPSHOT_PREFIX = "snapshot/";

interface SnapshotState {
  takenAt: number;
  offset: string | null;
  users: [string, EngineUser][];
  insurance: [string, bigint][];
  markets: EngineMarketState[];
}

export const takeSnapshot = async (
  engineManager: EngineManager,
  offset: string | null,
): Promise<string | null> => {
  if (!s3Configured()) {
    console.warn("S3 not configured; skipping snapshot");
    return null;
  }

  const state: SnapshotState = {
    takenAt: Date.now(),
    offset,
    users: Array.from(Users.entries()),
    insurance: insuranceFund.exportState(),
    markets: engineManager.exportState(),
  };

  const key = `${SNAPSHOT_PREFIX}snapshot-${state.takenAt}.json`;
  await putObject(key, serialize(state));

  console.log(`snapshot uploaded: ${key}`);
  return key;
};

export const loadLatestSnapshot = async (): Promise<SnapshotState | null> => {
  if (!s3Configured()) {
    console.warn("S3 not configured; starting with empty state");
    return null;
  }

  const files = await listObjects(SNAPSHOT_PREFIX);
  if (files.length === 0) return null;

  const latest = files.reduce((newest, file) =>
    file.lastModified > newest.lastModified ? file : newest,
  );

  const raw = await getObjectText(latest.key);
  if (!raw) return null;

  return deserialize<SnapshotState>(raw);
};

export const applySnapshot = (
  state: SnapshotState,
  engineManager: EngineManager,
) => {
  Users.clear();
  for (const [userId, user] of state.users) {
    Users.set(userId, user);
  }

  insuranceFund.importState(state.insurance);
  engineManager.restoreState(state.markets);
};

export const startSnapshotSchedule = (
  engineManager: EngineManager,
  getOffset: () => string | null,
) => {
  if (!s3Configured()) return;

  setInterval(() => {
    void takeSnapshot(engineManager, getOffset()).catch((error) =>
      console.error("failed to take snapshot", error),
    );
  }, config.SNAPSHOT_INTERVAL * 1000);
};
