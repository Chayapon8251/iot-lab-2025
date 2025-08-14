import { Hono } from "hono";
import { cors } from "hono/cors";
import apiRouter from "./routes/api.js";
import { serve } from "@hono/node-server"; // ใช้ serve จาก Node.js adapter แทน

const app = new Hono().basePath("/api");

// CORS ควรตั้งค่า origin ให้เป็น URL ของ Frontend ที่คุณ Deploy แล้ว
// เช่น "https://iot-lab-2025-frontend.onrender.com"
app.use(
  "*",
  cors({
   origin: "https://iot-lab-2025-3.onrender.com", // **ต้องแก้ไขเป็น URL จริง**
   allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.route("/v1", apiRouter);

// **ส่วนนี้คือโค้ดที่คุณต้องเพิ่มเข้าไป**
const port = parseInt(process.env.PORT) || 3000;
serve({
  fetch: app.fetch,
  port: port,
}, (info) => {
  console.log(`Server is running on port ${info.port}`);
});
