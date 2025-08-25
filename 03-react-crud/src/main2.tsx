import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "./index.css";     
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

// --- pages เดิม ---
import IndexPage from "./pages/index";
import BooksPage from "./pages/books";
import BookByIdPage from "./pages/book-by-id";
import BookCreatePage from "./pages/book-create";
import BookEditByIdPage from "./pages/book-edit-by-id";

// --- pages ใหม่ ---
import CoffeeMenuPage from "./pages/coffee";
import StaffOrdersPage from "./pages/staff-orders";

const theme = createTheme({
  primaryColor: "orange",
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <Notifications />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/books/create" element={<BookCreatePage />} />
          <Route path="/books/:id" element={<BookByIdPage />} />
          <Route path="/books/:id/edit" element={<BookEditByIdPage />} />
          <Route path="/coffee" element={<CoffeeMenuPage />} />
          <Route path="/staff/orders" element={<StaffOrdersPage />} />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  </React.StrictMode>
);