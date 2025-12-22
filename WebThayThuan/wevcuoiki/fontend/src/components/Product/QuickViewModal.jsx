import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { getProductDetails } from "../../services/ProductService";
import { addToCart as addToCartAPI } from "../../services/CartService";
import { isLoggedIn } from "../../services/AuthService";

const fmtVND = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(v || 0)
  );

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export default function QuickViewModal({ isOpen, onClose, productId, initialColor = null }) {
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  // Fetch product details
  useEffect(() => {
    if (!isOpen || !productId) return;

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getProductDetails(productId);
        if (!mounted) return;

        setProduct(data);

        // Set initial color
        const variants = Array.isArray(data?.variants) ? data.variants : [];
        const colors = [...new Set(variants.map((v) => v.color ?? v.Color).filter(Boolean))];
        const firstColor = initialColor || colors[0] || null;
        setSelectedColor(firstColor);

        // Set initial size for selected color
        if (firstColor) {
          const sizesForColor = variants
            .filter((v) => (v.color ?? v.Color) === firstColor && (v.size ?? v.Size))
            .map((v) => v.size ?? v.Size);
          if (sizesForColor.length > 0) {
            setSelectedSize(sizesForColor[0]);
          }
        }

        // Set first image
        const images = Array.isArray(data?.images) ? data.images : [];
        if (images.length > 0) {
          setActiveImgIndex(0);
        }
      } catch (err) {
        console.error("Lỗi tải sản phẩm", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isOpen, productId, initialColor]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setProduct(null);
      setActiveImgIndex(0);
      setSelectedColor(null);
      setSelectedSize(null);
      setQuantity(1);
    }
  }, [isOpen]);

  const images = useMemo(() => {
    if (!product) return [];
    const allImages = Array.isArray(product?.images) ? product.images : [];
    
    // Filter by selected color if available
    if (selectedColor) {
      const colorImages = allImages.filter(
        (img) => (img.color ?? img.Color) === selectedColor
      );
      if (colorImages.length > 0) return colorImages;
    }
    
    return allImages;
  }, [product, selectedColor]);

  const variants = useMemo(() => {
    if (!product) return [];
    return Array.isArray(product?.variants) ? product.variants : [];
  }, [product]);

  const colors = useMemo(() => {
    const set = new Set();
    variants.forEach((v) => {
      const color = v.color ?? v.Color;
      if (color) set.add(color);
    });
    return Array.from(set);
  }, [variants]);

  const sizesForColor = useMemo(() => {
    if (!selectedColor) return [];
    return variants
      .filter((v) => (v.color ?? v.Color) === selectedColor && (v.size ?? v.Size))
      .map((v) => ({
        size: v.size ?? v.Size,
        stock: Number(v.stockQuantity ?? v.StockQuantity ?? 0),
      }));
  }, [variants, selectedColor]);

  const matchedVariant = useMemo(() => {
    return variants.find(
      (v) =>
        (selectedColor ? (v.color ?? v.Color) === selectedColor : true) &&
        (selectedSize ? (v.size ?? v.Size) === selectedSize : true)
    );
  }, [variants, selectedColor, selectedSize]);

  const stock = useMemo(() => {
    if (matchedVariant) return Number(matchedVariant.stockQuantity ?? matchedVariant.StockQuantity ?? 0);
    const total = variants.reduce((s, v) => s + Number(v.stockQuantity ?? v.StockQuantity ?? 0), 0);
    return total || Number(product?.stockQuantity ?? product?.StockQuantity ?? 0);
  }, [matchedVariant, variants, product]);

  const price = useMemo(() => {
    const base = Number(product?.price ?? product?.Price ?? 0);
    const saleP = product?.salePrice ?? product?.SalePrice ?? null;

    const vPrice = matchedVariant?.price != null ? Number(matchedVariant.price) : null;
    const vSale = matchedVariant?.salePrice != null ? Number(matchedVariant.salePrice) : null;

    const finalBase = vPrice != null ? vPrice : base;
    const finalSale = vSale != null ? vSale : saleP != null ? Number(saleP) : 0;

    const hasSale = finalSale > 0 && finalSale < finalBase;
    return { base: finalBase, sale: finalSale, hasSale };
  }, [product, matchedVariant]);

  const discountPercent = useMemo(() => {
    if (!price.hasSale) return 0;
    return Math.round((1 - price.sale / price.base) * 100);
  }, [price]);

  const maxQty = useMemo(() => {
    if (stock <= 0) return 0;
    if (sizesForColor.length > 0) {
      if (!selectedColor || !selectedSize) return 0;
      return matchedVariant ? Number(matchedVariant.stockQuantity ?? matchedVariant.StockQuantity ?? 0) : 0;
    }
    return stock;
  }, [stock, sizesForColor.length, selectedColor, selectedSize, matchedVariant]);

  const canAddToCart = stock > 0 && selectedColor && (sizesForColor.length === 0 || selectedSize);

  const handleColorChange = (color) => {
    setSelectedColor(color);
    setSelectedSize(null);
    setQuantity(1);

    // Update image to first image of selected color
    const colorImages = images.filter(
      (img) => (img.color ?? img.Color) === color
    );
    if (colorImages.length > 0) {
      const firstColorImgIndex = images.findIndex((img) => img === colorImages[0]);
      if (firstColorImgIndex >= 0) setActiveImgIndex(firstColorImgIndex);
    }

    // Auto-select first available size
    const sizes = variants
      .filter((v) => (v.color ?? v.Color) === color && (v.size ?? v.Size))
      .map((v) => v.size ?? v.Size);
    if (sizes.length > 0) {
      setSelectedSize(sizes[0]);
    }
  };

  const handleAddToCart = async () => {
    if (!isLoggedIn()) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
      return;
    }

    if (!canAddToCart) {
      alert("Vui lòng chọn đầy đủ thông tin sản phẩm");
      return;
    }

    try {
      setAddingToCart(true);
      const idProducts = product?.idProducts ?? product?.IdProducts;
      await addToCartAPI(idProducts, quantity, selectedColor || null, selectedSize || null);
      
      // Trigger cart update event
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      
      alert("Đã thêm vào giỏ hàng!");
      onClose();
    } catch (err) {
      alert(err.message || "Không thể thêm sản phẩm vào giỏ hàng");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleViewDetails = () => {
    const slug = product?.slug ?? product?.Slug;
    const id = product?.idProducts ?? product?.IdProducts;
    if (slug) {
      navigate(`/product/${slug}`);
    } else if (id) {
      navigate(`/product/${id}`);
    }
    onClose();
  };

  const currentImage = images[activeImgIndex];
  const currentImageUrl = currentImage?.url ?? currentImage?.Url ?? "";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-lg overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-neutral-100 transition-colors"
        >
          <FontAwesomeIcon icon={faXmark} className="text-neutral-600" />
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-neutral-500">Đang tải...</p>
          </div>
        ) : !product ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-neutral-500">Không tìm thấy sản phẩm</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            <div className="grid md:grid-cols-2 gap-6 p-6">
              {/* Left: Images */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative aspect-square bg-neutral-100 rounded-lg overflow-hidden">
                  {currentImageUrl ? (
                    <img
                      src={currentImageUrl}
                      alt={product?.name ?? product?.Name ?? ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                      No Image
                    </div>
                  )}
                  
                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/80 rounded-full hover:bg-white transition-colors"
                      >
                        <FontAwesomeIcon icon={faChevronLeft} className="text-neutral-600 text-sm" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveImgIndex((prev) => (prev + 1) % images.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/80 rounded-full hover:bg-white transition-colors"
                      >
                        <FontAwesomeIcon icon={faChevronRight} className="text-neutral-600 text-sm" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {images.map((img, idx) => {
                      const url = img?.url ?? img?.Url ?? "";
                      const isActive = idx === activeImgIndex;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImgIndex(idx)}
                          className={`flex-none w-16 h-16 rounded-lg overflow-hidden border-2 ${
                            isActive ? "border-red-600" : "border-neutral-200"
                          }`}
                        >
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right: Product Info */}
              <div className="space-y-4">
                {/* Title */}
                <h2 className="text-2xl font-bold text-neutral-900">
                  {product?.name ?? product?.Name ?? ""}
                </h2>

                {/* Product Info */}
                <div className="space-y-2 text-sm text-neutral-600">
                  <div>
                    <span className="font-semibold">Mã sản phẩm:</span>{" "}
                    {product?.sku ?? product?.Sku ?? "N/A"}
                  </div>
                  <div>
                    <span className="font-semibold">Tình trạng:</span>{" "}
                    <span className={stock > 0 ? "text-green-600" : "text-red-600"}>
                      {stock > 0 ? "Còn hàng" : "Hết hàng"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">Thương hiệu:</span>{" "}
                    {product?.categoryName ?? product?.CategoryName ?? "TORANO"}
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center gap-3">
                  {price.hasSale ? (
                    <>
                      <span className="text-2xl font-bold text-red-600">
                        {fmtVND(price.sale)}
                      </span>
                      <span className="text-lg text-neutral-500 line-through">
                        {fmtVND(price.base)}
                      </span>
                      <span className="px-2 py-1 bg-red-600 text-white text-sm font-semibold rounded">
                        -{discountPercent}%
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-neutral-900">
                      {fmtVND(price.base)}
                    </span>
                  )}
                </div>

                {/* Color Selection */}
                {colors.length > 0 && (
                  <div>
                    <div className="mb-2 text-sm font-semibold text-neutral-900">
                      Màu sắc:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((color) => {
                        const isSelected = selectedColor === color;
                        // Find image for this color
                        const colorImage = images.find(
                          (img) => (img.color ?? img.Color) === color
                        );
                        const thumbUrl = colorImage?.url ?? colorImage?.Url ?? "";

                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => handleColorChange(color)}
                            className={`relative px-4 py-2 rounded border-2 transition ${
                              isSelected
                                ? "border-red-600 bg-red-50 text-red-600"
                                : "border-neutral-300 hover:border-neutral-400"
                            }`}
                          >
                            {color}
                            {isSelected && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-[10px]">✓</span>
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Size Selection */}
                {sizesForColor.length > 0 && (
                  <div>
                    <div className="mb-2 text-sm font-semibold text-neutral-900">
                      Kích thước:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sizesForColor.map(({ size, stock: sizeStock }) => {
                        const isSelected = selectedSize === size;
                        const isOutOfStock = sizeStock <= 0;

                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              if (!isOutOfStock) {
                                setSelectedSize(size);
                                setQuantity(1);
                              }
                            }}
                            disabled={isOutOfStock}
                            className={`px-4 py-2 rounded border-2 transition ${
                              isSelected
                                ? "border-red-600 bg-red-50 text-red-600"
                                : isOutOfStock
                                ? "border-neutral-200 text-neutral-400 cursor-not-allowed"
                                : "border-neutral-300 hover:border-neutral-400"
                            }`}
                          >
                            {size}
                            {isSelected && (
                              <span className="ml-1 text-red-600">✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <div className="mb-2 text-sm font-semibold text-neutral-900">
                    Số lượng:
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-8 h-8 flex items-center justify-center border border-neutral-300 rounded hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                      disabled={quantity >= maxQty}
                      className="w-8 h-8 flex items-center justify-center border border-neutral-300 rounded hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!canAddToCart || addingToCart}
                  className="w-full py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:bg-neutral-400 disabled:cursor-not-allowed"
                >
                  {addingToCart ? "Đang thêm..." : "THÊM VÀO GIỎ"}
                </button>

                {/* View Details Link */}
                <button
                  type="button"
                  onClick={handleViewDetails}
                  className="text-sm text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                >
                  Xem chi tiết sản phẩm
                  <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

