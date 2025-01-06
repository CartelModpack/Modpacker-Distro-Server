import Database, { TableColumnSettings } from "@gavinhsmith/simpledb";
import { join } from "path";
import dbConfig from "../../../config/db.config.json" with {type: "json"};

let tables = <string[]>dbConfig.tables;
let configs = <TableColumnSettings[][]>dbConfig.configs;
let preloads = <DBPreload<any>[]>(<unknown>dbConfig.preloads);

/** Preload values from config. */
export interface DBPreload<T> {
  table: string;
  entry: T;
  exist_check_type: "entry" | "min_size";
  exist_check: string | number;
  fail_condition?: {
    key: string;
    value: any;
    condition: DBConfigCondition;
  };
}

/** Conditions that can be checked. */
export type DBConfigCondition = "=" | "!=" | "<" | ">" | "<=" | ">=";

/** Verifies a condition based on the inputs. */
export function verifyCondition<T>(
  item1: T,
  item2: T,
  condition: DBConfigCondition
): boolean {
  switch (condition) {
    case "=":
      return item1 === item2;
    case "!=":
      return item1 != item2;
    case "<":
      return item1 < item2;
    case ">":
      return item1 > item2;
    case "<=":
      return item1 <= item2;
    case ">=":
      return item1 >= item2;
  }
}

/** Database object to make requests to. */
export const db = new Database(join(process.cwd(), "database.db"));
export default db;

/** Create/load all tables. */
function createLoadTables(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existPromises: Promise<void>[] = [];
    const createPromises: Promise<void>[] = [];

    for (let i = 0; i < tables.length; i++) {
      existPromises.push(
        new Promise((resolveTable, rejectTable) => {
          db.exists(tables[i])
            .then((exists) => {
              if (exists) {
                console.info(`Loaded '${tables[i]}' table.`);
                resolveTable();
              } else {
                console.info(`Creating '${tables[i]}' table...`);

                createPromises.push(
                  new Promise((resolveLower, rejectLower) => {
                    db.create(tables[i], configs[i])
                      .then(() => {
                        console.info(`Created '${tables[i]}' table.`);
                        resolveLower();
                        resolveTable();
                      })
                      .catch((error) => {
                        rejectLower(error);
                        rejectTable(error);
                      });
                  })
                );
              }
            })
            .catch(rejectTable);
        })
      );
    }

    Promise.all(existPromises)
      .then(() => {
        Promise.all(createPromises)
          .then(() => resolve())
          .catch(reject);
      })
      .catch(reject);
  });
}

/** Insert preloads into database. */
function insertPreloadsIntoTables(): Promise<void> {
  return new Promise((resolve, reject) => {
    let promises: Promise<void>[] = [];

    for (let preload of preloads) {
      promises.push(
        new Promise((resolvePreload, rejectPreload) => {
          console.info(`Inserting preload into ${preload.table}...`);

          db.table(preload.table)
            .allEntries()
            .then((entires) => {
              if (preload.exist_check_type === "min_size") {
                if (entires.length < <number>preload.exist_check) {
                  db.table(preload.table)
                    .add(preload.entry)
                    .then(() => {
                      console.info(`${preload.table} preload inserted.`);
                      resolvePreload();
                    })
                    .catch(rejectPreload);
                } else {
                  console.info(`${preload.table} preload not needed.`);
                  resolvePreload();
                }
              } else if (preload.exist_check_type === "entry") {
                for (let entry of entires) {
                  if (
                    entry[preload.exist_check] ===
                    preload.entry[preload.exist_check]
                  ) {
                    if (
                      preload.fail_condition != null &&
                      verifyCondition(
                        entry[preload.fail_condition.key],
                        preload.fail_condition.value,
                        preload.fail_condition.condition
                      )
                    ) {
                      rejectPreload(
                        new Error(
                          `Preload Fail Condition Met. ${
                            preload.fail_condition.key
                          }: ${entry[preload.fail_condition.key]} ${
                            preload.fail_condition.condition
                          } ${preload.fail_condition.value}`
                        )
                      );
                      return;
                    } else {
                      console.info(`${preload.table} preload not needed.`);
                      resolvePreload();
                      return;
                    }
                  }
                }

                db.table(preload.table)
                  .add(preload.entry)
                  .then(() => {
                    console.info(`${preload.table} preload inserted.`);
                    resolvePreload();
                  })
                  .catch(rejectPreload);
              } else if (preload.exist_check_type === "none") {
                db.table(preload.table)
                  .add(preload.entry)
                  .then(() => {
                    console.info(`${preload.table} preload inserted.`);
                    resolvePreload();
                  })
                  .catch(rejectPreload);
              } else {
                rejectPreload(new Error("Invalid Exist Check Type"));
              }
            })
            .catch(rejectPreload);
        })
      );
    }

    Promise.all(promises)
      .then(() => resolve())
      .catch(reject);
  });
}

/** Initially load the database.  */
export function loadDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.info("Loading database...");

    createLoadTables()
      .then(() => {
        insertPreloadsIntoTables()
          .then(resolve)
          .catch(reject);
      })
      .catch(reject);
  });
}
