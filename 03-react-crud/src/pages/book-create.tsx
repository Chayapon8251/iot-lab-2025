import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout";
import {
  Button,
  Container,
  Divider,
  TextInput,
  NumberInput,
  Textarea,
  MultiSelect,
} from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { DateTimePicker } from "@mantine/dates";
import { http } from "../lib/http";
import type { Book } from "../lib/models";
import { CategoriesAPI, type Category } from "../lib/categories-api"; // <- ลบตัวอักษรแปลกออก

type FormValues = {
  title: string;
  author: string;
  publishedAt: Date | null;
  genreId: number | "" | null;   // คุมด้วย NumberInput
  detail: string;
  synopsis: string;
  categoryIds: string[];         // เก็บเป็น string[] ในฟอร์ม
};

export default function BookCreatePage() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  // options ของหมวดหมู่
  const [catOptions, setCatOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    CategoriesAPI.list()
      .then((res) => {
        const data: any = res.data;
        const rows: Category[] = Array.isArray(data) ? data : data.categories ?? [];
        setCatOptions(rows.map((c) => ({ value: String(c.id), label: c.title })));
      })
      .catch(() => {});
  }, []);

  const form = useForm<FormValues>({
    initialValues: {
      title: "",
      author: "",
      publishedAt: new Date(),
      genreId: "",
      detail: "",
      synopsis: "",
      categoryIds: [],
    },
    validate: {
      title: isNotEmpty("กรุณาระบุชื่อหนังสือ"),
      author: isNotEmpty("กรุณาระบุชื่อผู้แต่ง"),
      publishedAt: isNotEmpty("กรุณาระบุวันที่พิมพ์หนังสือ"),
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsProcessing(true);

      const published =
        values.publishedAt instanceof Date && !isNaN(values.publishedAt.valueOf())
          ? values.publishedAt
          : new Date();

      const payload = {
        title: values.title,
        author: values.author,
        publishedAt: published.toISOString(),
        genreId: values.genreId === "" ? null : Number(values.genreId),
        detail: values.detail || null,
        synopsis: values.synopsis || null,
        // แปลง string[] → number[] ตอนส่ง
        categoryIds: values.categoryIds.map((v) => Number(v)),
      };

      const res = await http.post<{ book: Book }>("/books", payload);
      const book = res.data.book;

      notifications.show({
        title: "เพิ่มข้อมูลหนังสือสำเร็จ",
        message: "ข้อมูลหนังสือได้รับการเพิ่มเรียบร้อยแล้ว",
        color: "teal",
      });
      navigate(`/books/${book.id}`);
    } catch (error: any) {
      notifications.show({
        title: "เกิดข้อผิดพลาด",
        message: error?.message ?? "กรุณาลองใหม่อีกครั้ง",
        color: "red",
      });
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <Container className="mt-8">
        <h1 className="text-xl">เพิ่มหนังสือในระบบ</h1>

        <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-8">
          <TextInput label="ชื่อหนังสือ" placeholder="ชื่อหนังสือ" {...form.getInputProps("title")} />
          <TextInput label="ชื่อผู้แต่ง" placeholder="ชื่อผู้แต่ง" {...form.getInputProps("author")} />

          {/* DateTimePicker v7 รับ Date | null */}
          <DateTimePicker
            label="วันที่พิมพ์"
            placeholder="วันที่พิมพ์"
            value={form.values.publishedAt}
            onChange={(d) => form.setFieldValue("publishedAt", d)}
          />

          {/* NumberInput v7: คุมค่าเอง ไม่ใช้ getInputProps */}
          <NumberInput
            label="หมวดหมู่หลัก (genreId) - ใส่เป็นตัวเลขหรือเว้นว่าง"
            placeholder="1"
            min={1}
            value={form.values.genreId === "" || form.values.genreId === null ? "" : Number(form.values.genreId)}
            onChange={(val) => form.setFieldValue("genreId", val === "" ? "" : Number(val))}
          />

          <Textarea
            label="รายละเอียดหนังสือ"
            placeholder="เช่น เล่มปกแข็ง 320 หน้า..."
            autosize
            minRows={3}
            {...form.getInputProps("detail")}
          />

          <Textarea
            label="เรื่องย่อ"
            placeholder="สรุปเนื้อเรื่องโดยย่อ..."
            autosize
            minRows={4}
            {...form.getInputProps("synopsis")}
          />

          {/* MultiSelect v7: เก็บ string[] ในฟอร์ม */}
          <MultiSelect
            label="หมวดหมู่ (เลือกได้หลายอัน)"
            placeholder="เลือกหมวดหมู่"
            searchable
            clearable
            nothingFoundMessage="ไม่พบหมวดหมู่"
            data={catOptions}
            value={form.values.categoryIds}
            onChange={(vals) => form.setFieldValue("categoryIds", vals)}
          />

          <Divider />
          <Button type="submit" loading={isProcessing}>
            บันทึกข้อมูล
          </Button>
        </form>
      </Container>
    </Layout>
  );
}
