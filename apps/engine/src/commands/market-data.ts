import type { GetDepthCommand, GetMarketRiskCommand } from "@perpex/types";
import type { EngineManager } from "../services/engine-manager";
import { EngineError } from "../utils/engine-error";
import { toString } from "../utils/conversion";
import { fundingRateBps } from "../utils/funding-rate";
import { publishError, publishSuccess } from "./publish";

export const handleGetMarketRisk = async (
  engineManager: EngineManager,
  command: GetMarketRiskCommand,
) => {
  try {
    const engine = engineManager.get(command.market);
    if (!engine) throw new EngineError(404, "Market not found");

    const markPrice = engine.getMarkPrice();
    const indexPrice = engine.getIndexPrice();

    const rate =
      markPrice !== undefined && indexPrice !== undefined
        ? fundingRateBps(indexPrice, markPrice)
        : 0n;

    await publishSuccess(command.correlationId, {
      market: command.market,
      markPrice: markPrice !== undefined ? toString(markPrice) : null,
      indexPrice: indexPrice !== undefined ? toString(indexPrice) : null,
      fundingRateBps: rate.toString(),
    });
  } catch (error) {
    await publishError(command.correlationId, error);
  }
};

export const handleGetDepth = async (
  engineManager: EngineManager,
  command: GetDepthCommand,
) => {
  try {
    const engine = engineManager.get(command.market);
    if (!engine) throw new EngineError(404, "Market not found");

    await publishSuccess(command.correlationId, {
      market: command.market,
      depth: engine.getDepth(),
    });
  } catch (error) {
    await publishError(command.correlationId, error);
  }
};
