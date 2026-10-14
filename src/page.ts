export class Page<T> {
  readonly data: T[];
  readonly hasMore: boolean;
  readonly nextCursor: string | null;
  readonly #next: (cursor: string) => Promise<Page<T>>;

  constructor(
    data: T[],
    hasMore: boolean,
    nextCursor: string | null,
    next: (cursor: string) => Promise<Page<T>>
  ) {
    this.data = data;
    this.hasMore = hasMore;
    this.nextCursor = nextCursor;
    this.#next = next;
  }

  async nextPage(): Promise<Page<T> | null> {
    return this.hasMore && this.nextCursor !== null ? this.#next(this.nextCursor) : null;
  }

  async *autoPaginate(): AsyncGenerator<T, void, undefined> {
    let page: Page<T> | null = this;

    while (page !== null) {
      yield* page.data;
      page = await page.nextPage();
    }
  }
}
