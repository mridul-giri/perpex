import type { CreateMarketCommand } from "@perpex/types";
import { EngineManager } from "../services/engine-manager";
import { publishError, publishMarketCreated, publishSuccess } from "./publish";

export const handleCreateMarket = async (
  engineManager: EngineManager,
  command: CreateMarketCommand,
) => {
  try {
    const engine = engineManager.register({
      marketSlug: command.marketSlug,
      imageUrl: command.imageUrl,
    });

    const market = engine.getMarket();
    await publishMarketCreated(market);
    await publishSuccess(command.correlationId, market);
  } catch (error) {
    await publishError(command.correlationId, error);
  }
};
