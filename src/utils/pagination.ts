import type { Request } from "express";

export class Pagination {
  public page;
  public limit;
  public offset;
  public last = 0;
  public total = -1;
  public between: Number[] = [];

  constructor(req: Request) {
    this.page = (req.params["page"] as any) || 1;
    this.limit = (req.params["limit"] as any) || 10;

    this.page = Math.max(this.page, 1);
    this.limit = Math.max(this.limit, 1);
    this.offset = (this.page - 1) * this.limit;
  }

  rawquery() {
    return `OFFSET ${this.offset} LIMIT ${this.limit} `;
  }

  setPages(total: number) {
    this.total = total;
    this.last = Math.ceil(total / this.limit);

    for (let i = this.page - 2; i < this.page + 3; i++) {
      if (i > 0 && i <= this.last) this.between.push(i);
    }
  }
}
