import Database from "@gavinhsmith/simpledatabase";
import { TableColumnSettings } from "@gavinhsmith/simpledatabase/types/DatabaseTypes.js";
import { join } from "path";
import dbConfig from "../../../config/db.config.json" with {type: "json"};

let tables = <string[]>dbConfig.tables;
let configs = <TableColumnSettings[][]>dbConfig.configs;
let version = dbConfig.version;

export const db = new Database(join(process.cwd(), "database.db"));
export default db;

export function loadDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.info("Loading database...");

    let promises: Promise<void>[] = [];

    for (let i = 0; i < tables.length; i++) {
      promises.push(new Promise((resolve, reject) => {
        db.exists(tables[i]).then(() => {
          console.info(`Loaded '${tables[i]}' table.`);
          resolve();
        }).catch(() => {
          console.info(`Creating '${tables[i]}' table...`);

          promises.push(new Promise((resolve, reject) => {
            db.create(tables[i], configs[i]).then(() => {
              console.info(`Created '${tables[i]}' table.`);
              resolve();
            }).catch(reject);
          }));

          resolve();
        });
      }));
    }

    Promise.all(promises)
      .then(() => {
        Promise.all(promises).then(() => {
          db.table<{key: string, value: string}>("mds_data").allEntries().then((data) => {
            for (let d of data) {
              if (d.key === "db_version") {
                if (d.value === String(version)) {
                  resolve();
                } else {
                  // Will go into updater later, but for now this is fine. 
                  reject(new Error(`DB config versions are not equal. Expected ${version}, was ${d.value}`));
                }
                return;
              }
            }
            db.table("mds_data").add({key: "db_version", value: String(version)}).then(() => {
              resolve();
            }).catch(reject);
          }).catch(reject);
        }).catch(reject);
      })
      .catch(reject);
  });
}
