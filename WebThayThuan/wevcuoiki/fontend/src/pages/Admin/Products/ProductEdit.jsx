import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAdminProduct, updateProduct } from "../../../services/AdminService";
import ProductForm from "./ProductForm";

export default function ProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getAdminProduct(id);
        if (!mounted) return;
        // Chuẩn hóa field images/variants
        setProduct({
          ...data,
          images: data.images || data.Images || [],
          variants: data.variants || data.Variants || [],
        });
      } catch (err) {
        setError(err.message || "Không tải được sản phẩm");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleSubmit = async (payload) => {
    try {
      setSubmitting(true);
      await updateProduct(id, {
        name: payload.name,
        slug: payload.slug || undefined,
        shortDescription: payload.shortDescription || undefined,
        description: payload.description || undefined,
        sku: payload.sku || undefined,
        price: payload.price,
        salePrice: payload.salePrice ?? undefined,
        status: payload.status || "active",
        idCategories: payload.idCategories ?? undefined,
        // Hiện chưa hỗ trợ update images/variants trong API nên bỏ qua để tránh lỗi
      });
      alert("Cập nhật sản phẩm thành công");
      navigate("/admin/products");
    } catch (err) {
      alert(err.message || "Không cập nhật được sản phẩm");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-neutral-500">Đang tải sản phẩm...</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Sửa sản phẩm</h1>
        <p className="text-sm text-neutral-600 mt-1">Cập nhật thông tin sản phẩm #{id}</p>
      </div>

      <ProductForm
        mode="edit"
        initialData={product}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
}

