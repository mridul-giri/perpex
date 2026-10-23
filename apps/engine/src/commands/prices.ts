import type { FundingSettlementCommand, MarkPriceCommand } from "@perpex/types";
import type { EngineManager } from "../services/engine-manager";
import { FundingManager } from "../services/funding";
import { insuranceFund } from "../services/insurance-fund";
import { LiquidationManager } from "../services/liquidation";
import { toBigInt } from "../utils/conversion";
import { fundingRateBps } from "../utils/funding-rate";
import {
  publishFunding,
  publishInsuranceFund,
  publishMarkPrice,
} from "../events/publish";

export const handleMarkPrice = async (
  engineManager: EngineManager,
  command: MarkPriceCommand,
) => {
  const engine = engineManager.get(command.market);
  if (!engine) return;

  const markPrice = toBigInt(command.price);
  const indexPrice = toBigInt(command.indexPrice);
  engine.setMarkPrice(markPrice);
  engine.setIndexPrice(indexPrice);

  await publishMarkPrice(
    command.market,
    markPrice,
    indexPrice,
    fundingRateBps(indexPrice, markPrice),
  );

  await new LiquidationManager(engineManager).liquidateUnderwater(
    command.market,
    markPrice,
  );
};

export const handleFundingSettlement = async (
  engineManager: EngineManager,
  command: FundingSettlementCommand,
) => {
  const engine = engineManager.get(command.market);
  if (!engine) return;

  const markPrice = engine.getMarkPrice();
  const indexPrice = engine.getIndexPrice();
  if (!markPrice || !indexPrice || indexPrice <= 0n) {
    console.log(`skipping funding for ${command.market}: missing price`);
    return;
  }

  const rate = fundingRateBps(indexPrice, markPrice);
  const result = new FundingManager().settle(command.market, rate, markPrice);

  await publishFunding(
    command.market,
    result.rateBps,
    result.payments,
    result.usedInsuranceFund,
  );
  if (result.usedInsuranceFund > 0n) {
    await publishInsuranceFund(
      command.market,
      insuranceFund.getFund(command.market),
    );
  }

  await new LiquidationManager(engineManager).liquidateUnderwater(
    command.market,
    markPrice,
  );
};
