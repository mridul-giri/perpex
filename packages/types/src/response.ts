export interface ResponseType {
  [key: string]: any;
  correlationId: string;
  ok: boolean;
  error?: string;
}

export type ResolverType = {
  resolve: Function;
  reject: Function;
  timer: ReturnType<typeof setTimeout>;
};
