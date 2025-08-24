import { useNavigate } from "react-router-dom";
import Layout from "../components/layout";
import { Button, Container, Divider, TextInput, NumberInput} from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { useState } from "react";
import axios, { AxiosError } from "axios";
import { notifications } from "@mantine/notifications";
import { BooksAPI } from "../lib/books-api";
import { DateTimePicker } from "@mantine/dates";

type FormValues = {
  title: string;
  author: string;
  publishedAt: Date | string;
  genreId?: number | "" | null;
};

export default function BookCreatePage() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const bookCreateForm = useForm<FormValues>({
    initialValues: {
      title: "",
      author: "",
      publishedAt: new Date(),
      genreId: "",
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
        publishedAt: new Date(values.publishedAt).toISOString(), // ✅ แปลงเป็น ISO
        genreId: values.genreId === "" ? null : Number(values.genreId),
      };

      const res = await BooksAPI.create(payload as any);
      const book = (res.data as any).book ?? res.data;

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
          <TextInput
            label="ชื่อหนังสือ"
            placeholder="ชื่อหนังสือ"
            {...bookCreateForm.getInputProps("title")}
          />

          <TextInput
            label="ชื่อผู้แต่ง"
            placeholder="ชื่อผู้แต่ง"
            {...bookCreateForm.getInputProps("author")}
          />

          <DateTimePicker
            label="วันที่พิมพ์"
            placeholder="วันที่พิมพ์"
            {...bookCreateForm.getInputProps("publishedAt")}
          />

          <NumberInput
            label="หมวดหมู่ (genreId) - ใส่เป็นตัวเลขหรือเว้นว่าง"
            placeholder="1"
            {...bookCreateForm.getInputProps("genreId")}
            min={1}
          />

          {/* TODO: detail / synopsis / categories[] สามารถเพิ่ม input ภายหลังได้ */}

          <Divider />
          <Button type="submit" loading={isProcessing}>
            บันทึกข้อมูล
          </Button>
        </form>
      </Container>
    </Layout>
  );
}