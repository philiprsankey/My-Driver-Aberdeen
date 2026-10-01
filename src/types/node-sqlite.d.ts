declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
  }

  export interface StatementSync {
    run(...params: Array<string | number | null>): unknown;
    get(...params: Array<string | number | null>): unknown;
    all(...params: Array<string | number | null>): unknown[];
  }
}
