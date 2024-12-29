import Database from "@gavinhsmith/simpledatabase";
import { TableColumnSettings } from "@gavinhsmith/simpledatabase/types/DatabaseTypes.js";
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
    let promises: Promise<void>[] = [];

    for (let i = 0; i < tables.length; i++) {
      promises.push(
        new Promise((resolve, reject) => {
          db.exists(tables[i])
            .then(() => {
              console.info(`Loaded '${tables[i]}' table.`);
              resolve();
            })
            .catch(() => {
              console.info(`Creating '${tables[i]}' table...`);

              promises.push(
                new Promise((resolveLower, rejectLower) => {
                  db.create(tables[i], configs[i])
                    .then(() => {
                      console.info(`Created '${tables[i]}' table.`);
                      resolveLower();
                      resolve();
                    })
                    .catch((error) => {
                      rejectLower(error);
                      reject(error);
                    });
                })
              );
            });
        })
      );
    }

    Promise.all(promises)
      .then(() => resolve())
      .catch(reject);
  });
}

/** Insert preloads into database. */
function insertPreloadsIntoTables(): Promise<void> {
  return new Promise((resolve, reject) => {
    let promises: Promise<void>[] = [];

    for (let preload of preloads) {
      promises.push(
        new Promise((resolve, reject) => {
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
                      resolve();
                    })
                    .catch(reject);
                } else {
                  console.info(`${preload.table} preload not needed.`);
                  resolve();
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
                      reject(
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
                      resolve();
                      return;
                    }
                  }
                }

                db.table(preload.table)
                  .add(preload.entry)
                  .then(() => {
                    console.info(`${preload.table} preload inserted.`);
                    resolve();
                  })
                  .catch(reject);
              } else {
                reject(new Error("Invalid Exist Check Type"));
              }
            })
            .catch(reject);
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
          .then(() => resolve())
          .catch(reject);
      })
      .catch(reject);
  });
}
