import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash, faEdit } from "@fortawesome/free-solid-svg-icons";

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
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [editingVariantIndex, setEditingVariantIndex] = useState(-1);

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
      
      // Parse images
      const imageList = (initialData.images || []).map((img) => ({
        url: img.url || img,
        id: img.idProductImages || null,
      }));
      setImages(imageList);
      
      // Parse variants
      const variantList = (initialData.variants || []).map((v) => ({
        color: v.color || "",
        size: v.size || "",
        stockQuantity: v.stockQuantity || 0,
        price: v.price || null,
        salePrice: v.salePrice || null,
        sku: v.sku || "",
        status: v.status || "active",
        id: v.idProductVariants || null,
      }));
      setVariants(variantList);
    }
  }, [initialData]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImages([...images, { url: newImageUrl.trim(), id: null }]);
      setNewImageUrl("");
    }
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        color: "",
        size: "",
        stockQuantity: 0,
        price: null,
        salePrice: null,
        sku: "",
        status: "active",
        id: null,
      },
    ]);
    setEditingVariantIndex(variants.length);
  };

  const handleUpdateVariant = (index, field, value) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const handleRemoveVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
    if (editingVariantIndex === index) {
      setEditingVariantIndex(-1);
    } else if (editingVariantIndex > index) {
      setEditingVariantIndex(editingVariantIndex - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Convert images to array of URLs
    const imageUrls = images.map((img) => img.url);

    // Convert variants to array
    const variantList = variants.map((v) => ({
      color: v.color || null,
      size: v.size || null,
      stockQuantity: v.stockQuantity || 0,
      price: v.price || null,
      salePrice: v.salePrice || null,
      sku: v.sku || "",
      status: v.status || "active",
    }));

    onSubmit({
      ...form,
      price: form.price === "" ? null : Number(form.price),
      salePrice: form.salePrice === "" ? null : Number(form.salePrice),
      idCategories: form.idCategories === "" ? null : Number(form.idCategories),
      images: imageUrls,
      variants: variantList,
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

      {/* Images Section */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-neutral-700">Ảnh sản phẩm</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="px-3 py-1 text-sm rounded-lg border border-neutral-300"
              placeholder="Nhập URL ảnh..."
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddImage())}
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
            >
              <FontAwesomeIcon icon={faPlus} className="text-xs" />
              Thêm
            </button>
          </div>
        </div>

        {images.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-4">Chưa có ảnh nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700 border border-neutral-200">Ảnh</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700 border border-neutral-200">URL</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-neutral-700 border border-neutral-200 w-20">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {images.map((img, index) => (
                  <tr key={index} className="hover:bg-neutral-50">
                    <td className="px-3 py-2 border border-neutral-200">
                      <img
                        src={img.url}
                        alt={`Image ${index + 1}`}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                          e.target.src = "/assets/img/no-image.jpg";
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 border border-neutral-200">
                      <input
                        type="text"
                        className="w-full px-2 py-1 text-xs rounded border border-neutral-300"
                        value={img.url}
                        onChange={(e) => {
                          const updated = [...images];
                          updated[index].url = e.target.value;
                          setImages(updated);
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 border border-neutral-200 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Xóa"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Variants Section */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-neutral-700">Biến thể sản phẩm (Màu, Size)</label>
          <button
            type="button"
            onClick={handleAddVariant}
            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-1"
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
            Thêm biến thể
          </button>
        </div>

        {variants.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-4">Chưa có biến thể nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700 border border-neutral-200">Màu</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700 border border-neutral-200">Size</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700 border border-neutral-200">Tồn kho</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700 border border-neutral-200">Giá</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700 border border-neutral-200">Giá KM</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700 border border-neutral-200">SKU</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700 border border-neutral-200">Trạng thái</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-neutral-700 border border-neutral-200 w-20">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant, index) => (
                  <tr key={index} className="hover:bg-neutral-50">
                    <td className="px-3 py-2 border border-neutral-200">
                      <input
                        type="text"
                        className="w-full px-2 py-1 text-xs rounded border border-neutral-300"
                        value={variant.color}
                        onChange={(e) => handleUpdateVariant(index, "color", e.target.value)}
                        placeholder="Màu sắc"
                      />
                    </td>
                    <td className="px-3 py-2 border border-neutral-200">
                      <input
                        type="text"
                        className="w-full px-2 py-1 text-xs rounded border border-neutral-300"
                        value={variant.size}
                        onChange={(e) => handleUpdateVariant(index, "size", e.target.value)}
                        placeholder="Size"
                      />
                    </td>
                    <td className="px-3 py-2 border border-neutral-200">
                      <input
                        type="number"
                        min="0"
                        className="w-full px-2 py-1 text-xs rounded border border-neutral-300"
                        value={variant.stockQuantity}
                        onChange={(e) => handleUpdateVariant(index, "stockQuantity", parseInt(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-3 py-2 border border-neutral-200">
                      <input
                        type="number"
                        min="0"
                        className="w-full px-2 py-1 text-xs rounded border border-neutral-300"
                        value={variant.price || ""}
                        onChange={(e) => handleUpdateVariant(index, "price", e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="Giá"
                      />
                    </td>
                    <td className="px-3 py-2 border border-neutral-200">
                      <input
                        type="number"
                        min="0"
                        className="w-full px-2 py-1 text-xs rounded border border-neutral-300"
                        value={variant.salePrice || ""}
                        onChange={(e) => handleUpdateVariant(index, "salePrice", e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="Giá KM"
                      />
                    </td>
                    <td className="px-3 py-2 border border-neutral-200">
                      <input
                        type="text"
                        className="w-full px-2 py-1 text-xs rounded border border-neutral-300"
                        value={variant.sku}
                        onChange={(e) => handleUpdateVariant(index, "sku", e.target.value)}
                        placeholder="SKU"
                      />
                    </td>
                    <td className="px-3 py-2 border border-neutral-200">
                      <select
                        className="w-full px-2 py-1 text-xs rounded border border-neutral-300"
                        value={variant.status}
                        onChange={(e) => handleUpdateVariant(index, "status", e.target.value)}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 border border-neutral-200 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Xóa"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

