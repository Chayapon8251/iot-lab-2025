import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout";
import { Button, Container, Divider, TextInput, NumberInput, Textarea, MultiSelect } from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { DateTimePicker } from "@mantine/dates";
import { http } from "../lib/http";
import type { Book } from "../lib/models";
import { CategoriesAPI, type Category } from "../lib/categories-api";

type FormValues = {
  title: string;
  author: string;
  publishedAt: Date | string;
  genreId?: number | "" | null;
  detail?: string;
  synopsis?: string;
  categoryIds: string[]; // MultiSelect ใช้ string[]
};

export default function BookCreatePage() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  // options ของหมวดหมู่
  const [catOptions, setCatOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    // ดึงหมวดหมู่มาเป็นตัวเลือก
    CategoriesAPI.list()
      .then((res) => {
        const data: any = res.data;
        const rows: Category[] = Array.isArray(data) ? data : (data.categories ?? []);
        setCatOptions(rows.map((c) => ({ value: String(c.id), label: c.title })));
      })
      .catch(() => {});
  }, []);

  const bookCreateForm = useForm<FormValues>({
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

      const payload = {
        title: values.title,
        author: values.author,
        publishedAt: new Date(values.publishedAt).toISOString(),
        genreId: values.genreId === "" ? null : Number(values.genreId),
        detail: values.detail || null,
        synopsis: values.synopsis || null,
        categoryIds: values.categoryIds.map((v) => Number(v)), // ⬅️ array ของ id
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

        <form onSubmit={bookCreateForm.onSubmit(handleSubmit)} className="space-y-8">
          <TextInput label="ชื่อหนังสือ" placeholder="ชื่อหนังสือ" {...bookCreateForm.getInputProps("title")} />
          <TextInput label="ชื่อผู้แต่ง" placeholder="ชื่อผู้แต่ง" {...bookCreateForm.getInputProps("author")} />
          <DateTimePicker label="วันที่พิมพ์" placeholder="วันที่พิมพ์" {...bookCreateForm.getInputProps("publishedAt")} />
          <NumberInput
            label="หมวดหมู่หลัก (genreId) - ใส่เป็นตัวเลขหรือเว้นว่าง"
            placeholder="1"
            {...bookCreateForm.getInputProps("genreId")}
            min={1}
          />

          {/* ใหม่: รายละเอียด + เรื่องย่อ */}
          <Textarea
            label="รายละเอียดหนังสือ"
            placeholder="เช่น เล่มปกแข็ง 320 หน้า..."
            autosize minRows={3}
            {...bookCreateForm.getInputProps("detail")}
          />
          <Textarea
            label="เรื่องย่อ"
            placeholder="สรุปเนื้อเรื่องโดยย่อ..."
            autosize minRows={4}
            {...bookCreateForm.getInputProps("synopsis")}
          />

          {/* ใหม่: เลือกหลายหมวดหมู่ */}
          <MultiSelect
            label="หมวดหมู่ (เลือกได้หลายอัน)"
            placeholder="เลือกหมวดหมู่"
            searchable
            clearable
            data={catOptions}
            {...bookCreateForm.getInputProps("categoryIds")}
            // เปิดให้สร้างใหม่ได้ (ถ้าต้องการ)
            creatable
            getCreateLabel={(q) => `+ สร้างหมวดหมู่ "${q}"`}
            onCreate={async (query) => {
              // สร้างในฐานข้อมูล แล้วเติมเข้า options
              const created = await CategoriesAPI.create(query);
              const cat = created.data.category;
              const item = { value: String(cat.id), label: cat.title };
              setCatOptions((c) => [...c, item]);
              return item;
            }}
          />

          <Divider />
          <Button type="submit" loading={isProcessing}>บันทึกข้อมูล</Button>
        </form>
      </Container>
    </Layout>
  );
}
