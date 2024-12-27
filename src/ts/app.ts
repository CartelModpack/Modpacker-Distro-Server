import express from "express";
import { engine } from "express-handlebars";
import http from "http";
import { join } from "path";

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
