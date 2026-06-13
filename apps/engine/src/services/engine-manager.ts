import type { PayloadType } from "@perpex/types";
import { Engine } from "./engine";
import { UserService } from "./user";
import { MathchingEngine } from "./matching-engine";
import { PositionManager } from "./position-manager";

export class EngineManager {
  private markets = new Map<string, Engine>();
  //TODO: this could be wrong creating single instance and passing that instance across all the markets, will comeback after watching multithreading video.
  private userService = new UserService();
  private matcher = new MathchingEngine();
  private positionManager = new PositionManager();

  private register(payload: PayloadType) {
    const market = new Engine(
      this.userService,
      this.matcher,
      this.positionManager,
    );
    this.markets.set(payload.market, market);
    return market;
  }

  get(payload: PayloadType) {
    const market = this.markets.get(payload.market);
    if (!market) {
      return this.register(payload);
    }
    return market;
  }
}
