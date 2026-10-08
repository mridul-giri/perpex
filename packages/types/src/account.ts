export interface AccountCommand {
  userId: string;
  amount?: string;
  messageType: "on-ramp" | "withdraw" | "get-balance";
  correlationId: string;
}
