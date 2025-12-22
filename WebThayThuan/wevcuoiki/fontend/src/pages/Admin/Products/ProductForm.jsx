import { useEffect, useState } from "react";

const defaultData = {
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  sku: "",
  price: "",
  salePrice: "",
  status: "active",
  idCategories: "",
  images: [],
  variants: [],
};

/**
 * Form dùng chung cho tạo/sửa sản phẩm
 */
export default function ProductForm({ mode = "create", initialData, onSubmit, submitting }) {
  const [form, setForm] = useState(defaultData);
  const [imagesText, setImagesText] = useState("");
  const [variantsText, setVariantsText] = useState("");

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        slug: initialData.slug || "",
        shortDescription: initialData.shortDescription || "",
        description: initialData.description || "",
        sku: initialData.sku || "",
        price: initialData.price ?? "",
        salePrice: initialData.salePrice ?? "",
        status: initialData.status || "active",
        idCategories: initialData.idCategories ?? "",
        images: initialData.images || [],
        variants: initialData.variants || [],
      });
      setImagesText((initialData.images || []).map((i) => i.url || i).join("\n"));
      setVariantsText(
        initialData.variants && initialData.variants.length > 0
          ? JSON.stringify(initialData.variants, null, 2)
          : ""
      );
    }
  }, [initialData]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Parse images (1 url mỗi dòng)
    const images = imagesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    // Parse variants (optional JSON array)
    let variants = [];
    if (variantsText.trim()) {
      try {
        const parsed = JSON.parse(variantsText);
        if (Array.isArray(parsed)) {
          variants = parsed;
        } else {
          alert("Variants phải là mảng JSON");
          return;
        }
      } catch (err) {
        alert("Không parse được variants JSON");
        return;
      }
    }

    onSubmit({
      ...form,
      price: form.price === "" ? null : Number(form.price),
      salePrice: form.salePrice === "" ? null : Number(form.salePrice),
      idCategories: form.idCategories === "" ? null : Number(form.idCategories),
      images,
      variants,
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Tên sản phẩm *</label>
          <input
            type="text"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Slug</label>
          <input
            type="text"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.slug}
            onChange={(e) => handleChange("slug", e.target.value)}
            placeholder="tự sinh nếu để trống"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">SKU</label>
          <input
            type="text"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.sku}
            onChange={(e) => handleChange("sku", e.target.value)}
            placeholder="tự sinh nếu để trống"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Danh mục (IdCategories) *</label>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.idCategories}
            onChange={(e) => handleChange("idCategories", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Giá *</label>
          <input
            type="number"
            min="0"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.price}
            onChange={(e) => handleChange("price", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Giá khuyến mãi</label>
          <input
            type="number"
            min="0"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.salePrice}
            onChange={(e) => handleChange("salePrice", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Trạng thái</label>
          <select
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">Mô tả ngắn</label>
        <textarea
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
          rows={2}
          value={form.shortDescription}
          onChange={(e) => handleChange("shortDescription", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">Mô tả chi tiết</label>
        <textarea
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
          rows={4}
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Ảnh (mỗi dòng 1 URL)</label>
          <textarea
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            rows={6}
            value={imagesText}
            onChange={(e) => setImagesText(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Variants (JSON array, tùy chọn)</label>
          <textarea
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm"
            rows={6}
            value={variantsText}
            onChange={(e) => setVariantsText(e.target.value)}
            placeholder='[{"color":"Red","size":"M","stockQuantity":10,"price":200000,"sku":"SKU-RED-M","status":"active"}]'
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {submitting ? "Đang lưu..." : mode === "create" ? "Tạo sản phẩm" : "Lưu thay đổi"}
        </button>
      </div>
    </form>
  );
}

