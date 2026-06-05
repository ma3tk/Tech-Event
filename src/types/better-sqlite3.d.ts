/**
 * better-sqlite3 の最小型宣言 (E2E スクリプトから DB を直接参照するため)。
 * 利用するのは `new Database(path, opts).prepare(sql).get/all/run(...)` のみ。
 */
declare module "better-sqlite3" {
  interface Statement {
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
    run(...params: unknown[]): { changes: number; lastInsertRowid: number };
  }
  interface DatabaseOptions {
    readonly?: boolean;
    fileMustExist?: boolean;
    timeout?: number;
  }
  class Database {
    constructor(path: string, options?: DatabaseOptions);
    prepare(sql: string): Statement;
    close(): void;
    exec(sql: string): void;
  }
  export default Database;
}
