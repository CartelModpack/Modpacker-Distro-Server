// Modules
import express from "express";
import { engine } from "express-handlebars";
import http from "http";
import { join } from "path";
import Database from "@gavinhsmith/simpledatabase";

// Initiate Database
const db = new Database(join(process.cwd(), "database.db"));

console.info("Loading database...");
db.exists("users")
  .then(() => {
    console.info("Loaded table 'users'");
  })
  .catch(() => {
    console.info("Creating table 'users'...");
    db.create("users", [
      {
        name: "id",
        type: "INTENGER",
        isPrimaryKey: true,
      },
      {
        name: "username",
        type: "TEXT",
      },
      {
        name: "password",
        type: "TEXT",
      },
    ]).then(() => {
      console.info("Created table 'users'");
    });
  });

// Initiate server
console.info("Starting server...");

const app = express();
const server = http.createServer(app);

// Routing
app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: join(process.cwd(), "./web/views/layouts"),
    partialsDir: join(process.cwd(), "./web/views/partials"),
  })
);
app.set("view engine", "hbs");
app.set("views", join(process.cwd(), "./web/views"));
app.use(express.static(join(process.cwd(), "./web/public")));

app.use((_req, res) => {
  res.render("default");
});

// Start server
server.listen(8080, () => {
  console.info("Server started at *:8080");
});
