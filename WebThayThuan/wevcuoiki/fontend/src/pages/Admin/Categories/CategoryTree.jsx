import { useEffect, useState, useRef } from "react";
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategoryTree,
  updateAdminCategory,
} from "../../../services/CategoryService";
import { uploadImages } from "../../../services/AdminService";

function TreeNode({ node, onEdit, onDelete }) {
  const [open, setOpen] = useState(true);

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="border border-neutral-200 rounded-lg mb-2">
      <div className="flex items-center justify-between px-3 py-2 bg-neutral-50">
        <div className="flex items-center gap-2">
          {hasChildren && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="w-6 h-6 flex items-center justify-center rounded border border-neutral-300 text-xs"
            >
              {open ? "-" : "+"}
            </button>
          )}
          {!hasChildren && <span className="w-6" />}
          <div>
            <p className="font-medium text-neutral-900">{node.name}</p>
            <p className="text-xs text-neutral-500">
              slug: {node.slug} • SP: {node.productCount || 0} • Trạng thái: {node.status || "active"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(node)}
            className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Sửa
          </button>
          <button
            type="button"
            onClick={() => onDelete(node)}
            className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
          >
            Ẩn
          </button>
        </div>
      </div>
      {hasChildren && open && (
        <div className="pl-6 pr-3 pb-2 pt-1">
          {node.children.map((child) => (
            <TreeNode key={child.idCategories} node={child} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryTree() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    parentIdCategories: null,
    status: "active",
    img: "",
  });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setUploading(true);
      const result = await uploadImages(files);
      if (result.urls && result.urls.length > 0) {
        setForm((f) => ({ ...f, img: result.urls[0] }));
      }
    } catch (err) {
      alert(err.message || "Lỗi khi upload ảnh");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    loadTree();
  }, [keyword, status]);

  const loadTree = async () => {
    try {
      setLoading(true);
      const data = await getAdminCategoryTree({
        keyword: keyword || undefined,
        status: status || undefined,
      });
      setTree(data || []);
    } catch (err) {
      alert(err.message || "Không tải được danh mục");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setShowForm(false);
    setForm({
      name: "",
      slug: "",
      parentIdCategories: null,
      status: "active",
      img: "",
    });
  };

  const handleEdit = (node) => {
    setEditing(node);
    setShowForm(true);
    setForm({
      name: node.name || "",
      slug: node.slug || "",
      parentIdCategories: node.parentIdCategories || null,
      status: node.status || "active",
      img: node.img || "",
    });
  };

  const handleDelete = async (node) => {
    if (!window.confirm("Ẩn danh mục này (inactive)?")) return;
    try {
      await deleteAdminCategory(node.idCategories);
      await loadTree();
    } catch (err) {
      alert(err.message || "Không ẩn được danh mục");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        name: form.name,
        slug: form.slug || undefined,
        parentIdCategories: form.parentIdCategories || null,
        status: form.status || "active",
        img: form.img || undefined,
      };
      if (editing) {
        await updateAdminCategory(editing.idCategories, payload);
        alert("Cập nhật danh mục thành công");
      } else {
        await createAdminCategory(payload);
        alert("Tạo danh mục thành công");
      }
      resetForm();
      await loadTree();
    } catch (err) {
      alert(err.message || "Không lưu được danh mục");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Quản lý Danh mục</h1>
          <p className="text-sm text-neutral-600 mt-1">Cây danh mục cha - con, có thể thu gọn/mở rộng.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Tìm theo tên/slug..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
          >
            Thêm danh mục
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          {loading ? (
            <p className="text-neutral-500">Đang tải...</p>
          ) : tree.length === 0 ? (
            <p className="text-neutral-500">Chưa có danh mục.</p>
          ) : (
            tree.map((node) => (
              <TreeNode key={node.idCategories} node={node} onEdit={handleEdit} onDelete={handleDelete} />
            ))
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                {editing ? "Sửa danh mục" : "Thêm danh mục"}
              </h2>
              <button
                type="button"
                onClick={resetForm}
                className="text-neutral-500 hover:text-neutral-800 text-sm"
              >
                Đóng
              </button>
            </div>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Tên *</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Slug</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="Tự sinh nếu để trống"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">ID danh mục cha</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  value={form.parentIdCategories ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      parentIdCategories: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  placeholder="Để trống nếu là danh mục gốc"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Ảnh</label>
                <div className="mt-1 flex gap-2 flex-wrap">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                  >
                    {uploading ? "Đang tải..." : "Chọn từ máy"}
                  </button>
                  <input
                    type="text"
                    className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                    value={form.img}
                    onChange={(e) => setForm((f) => ({ ...f, img: e.target.value }))}
                    placeholder="Hoặc nhập URL ảnh..."
                  />
                </div>
                {form.img && (
                  <img
                    src={form.img}
                    alt="Preview"
                    className="mt-2 w-20 h-20 object-cover rounded border"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Trạng thái</label>
                <select
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Thêm danh mục"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-2 rounded-lg border border-neutral-300 text-sm"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


