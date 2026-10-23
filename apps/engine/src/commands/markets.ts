import type { CreateMarketCommand } from "@perpex/types";
import { EngineManager } from "../services/engine-manager";
import { insuranceFund } from "../services/insurance-fund";
import {
  publishError,
  publishInsuranceFund,
  publishMarketCreated,
  publishSuccess,
} from "../events/publish";

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
    await publishInsuranceFund(
      market.marketSlug,
      insuranceFund.getFund(market.marketSlug),
    );
    await publishSuccess(command.correlationId, market);
  } catch (error) {
    await publishError(command.correlationId, error);
  }
};
