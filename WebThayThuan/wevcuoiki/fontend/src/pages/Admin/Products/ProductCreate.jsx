import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProduct } from "../../../services/AdminService";
import ProductForm from "./ProductForm";

export default function ProductCreate() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (payload) => {
    try {
      setSubmitting(true);
      await createProduct({
        name: payload.name,
        slug: payload.slug || undefined,
        shortDescription: payload.shortDescription || undefined,
        description: payload.description || undefined,
        sku: payload.sku || undefined,
        price: payload.price,
        salePrice: payload.salePrice ?? undefined,
        status: payload.status || "active",
        idCategories: payload.idCategories,
        images: payload.images,
        variants: payload.variants,
      });
      alert("Tạo sản phẩm thành công");
      navigate("/admin/products");
    } catch (err) {
      alert(err.message || "Không tạo được sản phẩm");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Thêm sản phẩm</h1>
        <p className="text-sm text-neutral-600 mt-1">Nhập thông tin và lưu</p>
      </div>

      <ProductForm mode="create" onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}

