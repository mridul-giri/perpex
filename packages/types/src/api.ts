export interface ApiErrorBody {
  error: {
    message: string;
  };
}

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}
