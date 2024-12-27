import express from "express";
import http from "http";

// Initiate server
console.info("Starting server...");

const app = express();
const server = http.createServer(app);

// Start server
export default function launchApp() {
  server.listen(8080, () => {
    console.info("Server started at *:8080");
  });
}
