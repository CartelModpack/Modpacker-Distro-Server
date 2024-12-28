import Database from "@gavinhsmith/simpledatabase";
import { TableColumnSettings } from "@gavinhsmith/simpledatabase/types/DatabaseTypes.js";
import { join } from "path";
import dbConfig from "../../../config/db.config.json" with {type: "json"};
import { AuthUserAccount } from "../routes/middleware/auth.js";

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
            let createVersKey = true;
            for (let d of data) {
              if (d.key === "db_version") {
                createVersKey = false;
                if (d.value !== String(version)) {
                  // Will go into updater later, but for now this is fine. 
                  reject(new Error(`DB config versions are not equal. Expected ${version}, was ${d.value}`));
                }
              }
            }
            if (createVersKey) {
              db.table("mds_data").add({key: "db_version", value: String(version)}).then(() => {
                db.table<AuthUserAccount>("user_accounts").allEntries().then((accs) => {
                  if (accs.length <= 0) {
                    db.table<AuthUserAccount & {id: 0}>("user_accounts").add({
                      username: "admin",
                      // sha512 for "admin" 
                      hash: "c7ad44cbad762a5da0a452f9e854fdc1e0e7a52a38015f23f3eab1d80b931dd472634dfac71cd34ebc35d16ab7fb8a90c81f975113d6c7538dc69dd8de9077ec",
                      id: 0
                    }).then(() => {
                      resolve();
                    }).catch(reject);
                  } else {
                    resolve()
                  }
                }).catch(reject);
              }).catch(reject);
            } else {
              db.table<AuthUserAccount>("user_accounts").allEntries().then((accs) => {
                if (accs.length <= 0) {
                  db.table<AuthUserAccount & {id: 0}>("user_accounts").add({
                    username: "admin",
                    // sha512 for "admin" 
                    hash: "c7ad44cbad762a5da0a452f9e854fdc1e0e7a52a38015f23f3eab1d80b931dd472634dfac71cd34ebc35d16ab7fb8a90c81f975113d6c7538dc69dd8de9077ec",
                    id: 0
                  }).then(() => {
                    resolve();
                  }).catch(reject);
                } else {
                  resolve()
                }
              }).catch(reject);
            }
          }).catch(reject);
        }).catch(reject);
      })
      .catch(reject);
  });
}
