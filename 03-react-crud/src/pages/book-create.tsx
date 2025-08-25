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
  Select,
  Group,
  Badge,
  CloseButton,
  Text,
  Loader,
} from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { DateTimePicker } from "@mantine/dates";
import { http } from "../lib/http";
import type { Book } from "../lib/models";
import { CategoriesAPI, type Category } from "../lib/categories-api";

type FormValues = {
  title: string;
  author: string;
  publishedAt: Date | null;
  genreId: number | "" | null;
  detail: string;
  synopsis: string;
  categoryIds: string[]; // เก็บเป็น string[] ในฟอร์ม
};

export default function BookCreatePage() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  // dropdown options
  const [catOptions, setCatOptions] = useState<{ value: string; label: string }[]>([]);
  const [categoryPick, setCategoryPick] = useState<string | null>(null);
  const [catsLoading, setCatsLoading] = useState(true);
  const [catsError, setCatsError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setCatsLoading(true);
        const res = await CategoriesAPI.list();
        const data: any = res.data;
        const rows: Category[] = Array.isArray(data) ? data : data?.categories ?? [];
        setCatOptions(rows.map((c) => ({ value: String(c.id), label: c.title })));
        setCatsError(null);
      } catch (e: any) {
        setCatsError(e?.message ?? "โหลดหมวดหมู่ไม่สำเร็จ");
        setCatOptions([]);
      } finally {
        setCatsLoading(false);
      }
    })();
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
        categoryIds: values.categoryIds.map((v) => Number(v)),
      };

      const res = await http.post<{ book: Book }>("/books", payload);
      notifications.show({
        title: "เพิ่มข้อมูลหนังสือสำเร็จ",
        message: "ข้อมูลหนังสือได้รับการเพิ่มเรียบร้อยแล้ว",
        color: "teal",
      });
      navigate(`/books/${res.data.book.id}`);
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
      {/* เพิ่ม pb-24 ให้มีพื้นที่ด้านล่าง */}
      <Container className="mt-8 pb-24">
        <h1 className="text-xl">เพิ่มหนังสือในระบบ</h1>

        <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-8">
          <TextInput label="ชื่อหนังสือ" placeholder="ชื่อหนังสือ" {...form.getInputProps("title")} />
          <TextInput label="ชื่อผู้แต่ง" placeholder="ชื่อผู้แต่ง" {...form.getInputProps("author")} />

          <DateTimePicker
            label="วันที่พิมพ์"
            placeholder="วันที่พิมพ์"
            value={form.values.publishedAt}
            onChange={(d) => form.setFieldValue("publishedAt", d)}
          />

          <NumberInput
            label="หมวดหมู่หลัก (genreId) - ใส่เป็นตัวเลขหรือเว้นว่าง"
            placeholder="1"
            min={1}
            value={typeof form.values.genreId === "number" ? form.values.genreId : ""}
            onChange={(val) =>
              form.setFieldValue("genreId", val === "" || val === null ? "" : Number(val))
            }
            allowDecimal={false}
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

          {/* เลือกหมวดหมู่ทีละอัน */}
          <Select
            label="หมวดหมู่"
            placeholder={catsLoading ? "กำลังโหลด..." : "เลือกหมวดหมู่"}
            searchable
            clearable
            nothingFoundMessage={catsLoading ? "กำลังโหลด..." : "ไม่พบหมวดหมู่"}
            data={catOptions}
            value={categoryPick}
            onChange={setCategoryPick}
            rightSection={catsLoading ? <Loader size="xs" /> : undefined}
          />

          <Group justify="flex-start" gap="xs">
            <Button
              variant="light"
              onClick={() => {
                if (!categoryPick) return;
                if (!form.values.categoryIds.includes(categoryPick)) {
                  form.setFieldValue("categoryIds", [...form.values.categoryIds, categoryPick]);
                }
                setCategoryPick(null);
              }}
              disabled={!categoryPick}
            >
              เพิ่มหมวดหมู่
            </Button>

            {catsError && <Text c="red">({catsError})</Text>}
          </Group>

          {/* แสดงที่เลือกแล้ว */}
          <Group mt="xs" gap="xs">
            {form.values.categoryIds.length === 0 && <Text c="dimmed">ยังไม่ได้เลือก</Text>}
            {form.values.categoryIds.map((id) => {
              const label = catOptions.find((o) => o.value === id)?.label ?? id;
              return (
                <Badge
                  key={id}
                  rightSection={
                    <CloseButton
                      size="xs"
                      onClick={() =>
                        form.setFieldValue(
                          "categoryIds",
                          form.values.categoryIds.filter((x) => x !== id)
                        )
                      }
                    />
                  }
                >
                  {label}
                </Badge>
              );
            })}
          </Group>

          <Divider />
          <Button type="submit" loading={isProcessing}>
            บันทึกข้อมูล
          </Button>
        </form>
      </Container>
    </Layout>
  );
}
