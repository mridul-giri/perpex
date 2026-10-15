export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3002",
} as const;
