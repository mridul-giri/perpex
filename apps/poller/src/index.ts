import { connectRedis, readFromStream } from "@perpex/redis";
import { config } from "@perpex/config";
import { createOrder } from "./services/order";

await connectRedis();

async function storeToDb(data: any) {
  switch (data.messageType) {
    case "order-created": {
      await createOrder(data);
      break;
    }
  }
}

while (true) {
  const stream = await readFromStream(config.ORDERS_ACK);

  if (!stream[0]) continue;

  for (const { message } of stream[0].messages) {
    if (!message.data) continue;
    const data = JSON.parse(message.data);
    console.log("from the pooler", data);
    await storeToDb(data);
  }
}
