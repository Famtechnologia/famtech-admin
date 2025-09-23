import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import app from "./app/app.js";

// Resolve config.env relative to this file so loading works regardless of cwd
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../config.env");
dotenv.config({ path: envPath });


const PORT = process.env.PORT || 4000;

const server = http.createServer(app);
console.log(process.env.PORT);

server.listen(PORT, () => {
  console.log("🚀 Sever currently running on port 4000");
});
