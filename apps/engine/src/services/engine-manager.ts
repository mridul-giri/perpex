import type { Market } from "@perpex/types";
import { Engine } from "./engine";
import { UserService } from "./user";
import { MathchingEngine } from "./matching-engine";
import { PositionManager } from "./position-manager";
import { EngineError } from "../utils/engine-error";

export class EngineManager {
  private markets = new Map<string, Engine>();

  register(market: Market) {
    if (this.markets.has(market.marketSlug)) {
      throw new EngineError(409, "Market already exists");
    }

    const userService = new UserService();
    const matcher = new MathchingEngine();
    const positionManager = new PositionManager();

    const engine = new Engine(market, userService, matcher, positionManager);
    this.markets.set(market.marketSlug, engine);
    return engine;
  }

  get(marketSlug: string) {
    return this.markets.get(marketSlug);
  }
}
