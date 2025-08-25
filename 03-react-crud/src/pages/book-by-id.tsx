// src/pages/book-by-id.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../components/layout";
import { Container, Button, Badge, Divider } from "@mantine/core";
import dayjs from "dayjs";
import { http } from "../lib/http";

type Book = {
  id: number; title: string; author: string; publishedAt: string;
  detail?: string | null; synopsis?: string | null; genreId?: number | null;
};
type Category = { id: number; title: string };
type BookDetailResponse = { book: Book; categories?: Category[] } | Book;

export default function BookByIdPage() {
  const params = useParams();
  const rawId = params.id ?? (params as any).bookId ?? (params as any).book_id ?? ""; // ⬅️ รองรับหลายชื่อ
  const [book, setBook] = useState<Book | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [err, setErr] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const n = Number(rawId);
    if (!rawId || Number.isNaN(n)) {
      setErr("Invalid id"); setLoading(false); return;   // ⬅️ กัน param ว่าง
    }

    setErr(undefined);
    setLoading(true);
    (async () => {
      try {
        const res = await http.get<BookDetailResponse>(`/books/${n}`);
        const data = res.data as any;
        if ("book" in data) {
          setBook(data.book);
          setCats(data.categories ?? []);
        } else {
          setBook(data as Book);
          setCats([]);
        }
      } catch (e: any) {
        setErr(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [rawId]);

  if (loading) {
    return (
      <Layout>
        <Container className="mt-8">กำลังโหลด…</Container>
      </Layout>
    );
  }

  if (err) {
    return (
      <Layout>
        <Container className="mt-8">
          <div className="text-red-600">Error: {err}</div>
          <Link to="/books"><Button className="mt-4">กลับรายการหนังสือ</Button></Link>
        </Container>
      </Layout>
    );
  }

  if (!book) {
    return (
      <Layout>
        <Container className="mt-8">ไม่พบหนังสือ</Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container className="mt-8">
        <h1 className="text-3xl font-bold">{book.title}</h1>
        <div className="text-gray-600">โดย {book.author}</div>
        <div className="text-sm text-gray-500">
          ตีพิมพ์: {dayjs(book.publishedAt).format("DD/MM/YYYY HH:mm")}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
          <div className="bg-gray-200 aspect-[3/4] rounded-lg md:col-span-1 flex items-center justify-center text-gray-500">
            150 × 200
          </div>

          <div className="md:col-span-2 space-y-6">
            <section>
              <h2 className="font-semibold text-lg">รายละเอียดหนังสือ</h2>
              <p className="mt-2 whitespace-pre-line">{book.detail?.trim() || "—"}</p>
            </section>

            <section>
              <h2 className="font-semibold text-lg">เรื่องย่อ</h2>
              <p className="mt-2 whitespace-pre-line">{book.synopsis?.trim() || "—"}</p>
            </section>

            <section>
              <h2 className="font-semibold text-lg">หมวดหมู่</h2>
              <div className="mt-2 flex flex-wrap gap-8">
                {cats.length > 0 ? cats.map(c => <Badge key={c.id}>#{c.title}</Badge>) : <span>—</span>}
              </div>
            </section>

            <Divider />
            <Link to={`/books/${book.id}/edit`}>
              <Button leftSection={<span>✎</span>}>แก้ไขข้อมูลหนังสือ</Button>
            </Link>
          </div>
        </div>
      </Container>
    </Layout>
  );
}
