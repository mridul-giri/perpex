export type StreamMessages = {
  name: string;
  messages: {
    id: string;
    message: {
      [x: string]: string;
    };
  }[];
}[];
