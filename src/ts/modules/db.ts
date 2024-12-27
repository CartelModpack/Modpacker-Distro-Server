import Database from "@gavinhsmith/simpledatabase";
import { TableColumnSettings } from "@gavinhsmith/simpledatabase/types/DatabaseTypes.js";
import { join } from "path";
import dbConfig from "../../../db.config.json" with {type: "json"};

let tables = <string[]>dbConfig.tables;
let configs = <TableColumnSettings[][]>dbConfig.configs;

export const db = new Database(join(process.cwd(), "database.db"));
export default db;

export function loadDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.info("Loading database...");

    let promises: Promise<any>[] = [];

    for (let i = 0; i < tables.length; i++) {
      promises.push(
        db
          .exists(tables[i])
          .then(() => {
            console.info(`Loaded '${tables[i]}' table.`);
          })
          .catch(() => {
            console.info(`Creating '${tables[i]}' table...`);

            promises.push(
              db
                .create(tables[i], configs[i])
                .then(() => {
                  console.info(`Created '${tables[i]}' table.`);
                })
                .catch((error) => {
                  console.error(error);
                })
            );
          })
      );
    }

    (<Promise<void>>(<unknown>Promise.all(promises)))
      .then(resolve)
      .catch(reject);
  });
}
