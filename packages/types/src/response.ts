export interface ResponseType {
  [key: string]: any;
  correlationId: string;
  ok: boolean;
  status?: number;
  error?: string;
}

export type ResolverType = {
  resolve: Function;
  reject: Function;
  timer: ReturnType<typeof setTimeout>;
};
