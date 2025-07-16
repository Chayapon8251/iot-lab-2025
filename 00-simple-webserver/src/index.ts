import "dotenv/config";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { html } from "hono/html";
import { serveStatic } from "@hono/node-server/serve-static";
import { bearerAuth } from "hono/bearer-auth";
import { getBookById, getBooks } from "./services/books_service.js";

const app = new Hono();

app.use(
  "/api/*",
  bearerAuth({
    verifyToken: async (token, c) => {
      const { SECRET_PASSWORD } = env<{ SECRET_PASSWORD: string }>(c);
      return token === SECRET_PASSWORD;
    },
  })
);

// ----

app.get("/", (c) => {
  const { NAME } = env<{ NAME: string }>(c);
  return c.json({
    message: `Hello! my name is ${NAME}`,
  });
});

app.get("/html", (c) => {
  const { NAME } = env<{ NAME: string }>(c);

  // XSS protection is in place, avoid relying on it completely.
  const someBadScript = `
    <script>
      alert('Hello! ${NAME}')
    </script>
  `;

  return c.html(html`
    <html>
      <head>
        <link rel="stylesheet" type="text/css" href="semantic/dist/semantic.min.css" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"
        />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai+Looped:wght@100;200;300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style>
          body {
            font-family: "IBM Plex Sans Thai Looped", serif;
            padding: 30px;
          }

          :root {
            --pico-font-family-emoji: "IBM Plex Sans Thai Looped", serif;
          }
        </style>
      </head>
      <body>
        <h1>Hello! ${NAME}</h1>
        <table>
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>อายุ</th>
              <th>อาชีพ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>สมชาย</td>
              <td>30</td>
              <td>วิศวกร</td>
            </tr>
            <tr>
              <td>สมหญิง</td>
              <td>28</td>
              <td>นักออกแบบ</td>
            </tr>
            <tr>
              <td>John</td>
              <td>35</td>
              <td>Developer</td>
            </tr>
          </tbody>
        </table>
        ${someBadScript}
      </body>
    </html>
  `);
});

// ----

app.get("/api/books", async (c) => {
  const books = getBooks();
  return c.json(books);
});

app.get("/api/books/:bookId", async (c) => {
  const bookId = Number(c.req.param("bookId"));
  const book = getBookById(bookId);

  if (!book) {
    return c.json({ error: "Book not found" }, 404);
  }

  return c.json(book);
});

// ----

app.use("*", serveStatic({ root: "./public" }));

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://${info.address}:${info.port}`);
  }
);
