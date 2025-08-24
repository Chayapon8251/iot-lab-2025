import { useEffect, useState } from "react";
import Layout from "../components/layout";
import { Container, Button } from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import { http } from "../lib/http";

type Book = {
  id: number;
  title: string;
  author: string;
  publishedAt: string;
  genreId?: number | null;
};

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await http.get<{ books?: Book[] } | Book[]>("/books");
        const data: any = res.data;
        setBooks(Array.isArray(data) ? data : data.books ?? []);
      } catch (e: any) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Layout>
      <Container className="mt-8 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl">รายการหนังสือ</h1>
          <Button onClick={() => navigate("/books/create")}>เพิ่มหนังสือ</Button>
        </div>

        {loading && <div>กำลังโหลด…</div>}
        {err && <div className="text-red-600">Error: {err}</div>}

        <ul className="list-disc ml-6">
          {books.map((b) => (
            <li key={b.id}>
              <Link to={`/books/${b.id}`}>{b.title}</Link> — {b.author}
            </li>
          ))}
        </ul>
      </Container>
    </Layout>
  );
}
