using Backend_WebBanHang.Data;
using Backend_WebBanHang.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Backend_WebBanHang.Controllers
{
    [ApiController]
    [Route("api/admin/[controller]")]
    [Authorize]
    public class AdminProductsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminProductsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/admin/AdminProducts
        [HttpGet]
        public async Task<IActionResult> GetProducts(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? status = null)
        {
            if (!IsAdmin()) return Forbid();

            if (page <= 0) page = 1;
            if (pageSize <= 0 || pageSize > 100) pageSize = 20;

            // Admin có thể xem tất cả trạng thái hoặc filter theo status
            var query = _context.Products.AsQueryable();
            
            // Nếu status = null hoặc "all" => hiển thị tất cả
            // Nếu status = "active" hoặc "inactive" => filter theo status đó
            if (!string.IsNullOrWhiteSpace(status) && status.ToLower() != "all")
            {
                var normalizedStatus = NormalizeStatus(status);
                if (normalizedStatus != null)
                {
                    query = query.Where(p => p.Status == normalizedStatus);
                }
            }
            // Nếu status = null hoặc "all" => không filter, hiển thị tất cả

            var totalItems = await query.CountAsync();

            var products = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new
                {
                    p.IdProducts,
                    p.Name,
                    p.Slug,
                    p.Sku,
                    p.Price,
                    p.SalePrice,
                    p.Status,
                    p.IdCategories,
                    CategoryName = _context.Categories
                        .Where(c => c.IdCategories == p.IdCategories)
                        .Select(c => c.Name)
                        .FirstOrDefault(),
                    p.CreatedAt,
                    ThumbnailUrl = _context.ProductImages
                        .Where(i => i.IdProducts == p.IdProducts)
                        .OrderByDescending(i => i.IsPrimary.HasValue && i.IsPrimary.Value)
                        .ThenBy(i => i.Position ?? 0)
                        .Select(i => i.Url ?? "")
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(new
            {
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
                Items = products
            });
        }

        // GET: api/admin/AdminProducts/{id}
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetProduct(long id)
        {
            if (!IsAdmin()) return Forbid();

            var product = await _context.Products
                .Where(p => p.IdProducts == id)
                .FirstOrDefaultAsync();

            if (product == null) return NotFound();

            var images = await _context.ProductImages
                .Where(i => i.IdProducts == id)
                .OrderByDescending(i => i.IsPrimary.HasValue && i.IsPrimary.Value)
                .ThenBy(i => i.Position ?? 0)
                .Select(i => new
                {
                    i.IdProductImages,
                    Url = i.Url ?? "",
                    i.IsPrimary,
                    i.Position
                })
                .ToListAsync();

            var variants = await _context.ProductVariants
                .Where(v => v.IdProducts == id)
                .Select(v => new
                {
                    v.IdProductVariants,
                    Color = v.Color ?? "",
                    Size = v.Size ?? "",
                    v.StockQuantity,
                    v.Price,
                    v.SalePrice,
                    Sku = v.Sku ?? "",
                    Status = v.Status ?? ""
                })
                .ToListAsync();

            return Ok(new
            {
                product.IdProducts,
                product.Name,
                product.Slug,
                product.ShortDescription,
                product.Description,
                product.Sku,
                product.Price,
                product.SalePrice,
                product.Status,
                product.IdCategories,
                Images = images,
                Variants = variants
            });
        }

        // POST: api/admin/AdminProducts
        [HttpPost]
        public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request)
        {
            if (!IsAdmin()) return Forbid();
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var normalizedStatus = NormalizeStatus(request.Status) ?? "active";

            var product = new Product
            {
                Name = request.Name,
                Slug = request.Slug ?? GenerateSlug(request.Name),
                ShortDescription = request.ShortDescription,
                Description = request.Description,
                Sku = request.Sku ?? GenerateSku(),
                Price = request.Price,
                SalePrice = request.SalePrice,
                Status = normalizedStatus,
                IdCategories = request.IdCategories,
                CreatedAt = DateTime.Now
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            // Add images if provided
            if (request.Images != null && request.Images.Count > 0)
            {
                var productImages = request.Images.Select((url, index) => new ProductImage
                {
                    IdProducts = product.IdProducts,
                    Url = url,
                    IsPrimary = index == 0,
                    Position = index
                }).ToList();

                _context.ProductImages.AddRange(productImages);
            }

            // Add variants if provided
            if (request.Variants != null && request.Variants.Count > 0)
            {
                var variants = request.Variants.Select((v, index) => new ProductVariant
                {
                    IdProducts = product.IdProducts,
                    Color = v.Color,
                    Size = v.Size,
                    StockQuantity = v.StockQuantity,
                    Price = v.Price,
                    SalePrice = v.SalePrice,
                    Sku = string.IsNullOrWhiteSpace(v.Sku) 
                        ? $"SKU-{product.IdProducts}-{index}-{DateTime.Now.Ticks}" 
                        : v.Sku,
                    Status = v.Status ?? "active"
                }).ToList();

                _context.ProductVariants.AddRange(variants);
            }

            await _context.SaveChangesAsync();

            return Ok(new { IdProducts = product.IdProducts, Message = "Tạo sản phẩm thành công" });
        }

        // PUT: api/admin/AdminProducts/{id}
        [HttpPut("{id:long}")]
        public async Task<IActionResult> UpdateProduct(long id, [FromBody] UpdateProductRequest request)
        {
            if (!IsAdmin()) return Forbid();

            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();

            var normalizedStatus = NormalizeStatus(request.Status);

            product.Name = request.Name ?? product.Name;
            product.Slug = request.Slug ?? product.Slug;
            product.ShortDescription = request.ShortDescription ?? product.ShortDescription;
            product.Description = request.Description ?? product.Description;
            product.Sku = request.Sku ?? product.Sku;
            product.Price = request.Price ?? product.Price;
            product.SalePrice = request.SalePrice;
            if (normalizedStatus != null) product.Status = normalizedStatus;
            if (request.IdCategories.HasValue) product.IdCategories = request.IdCategories.Value;

            // Update images if provided
            if (request.Images != null)
            {
                var oldImages = _context.ProductImages.Where(pi => pi.IdProducts == id);
                _context.ProductImages.RemoveRange(oldImages);

                if (request.Images.Count > 0)
                {
                    var newImages = request.Images.Select((url, index) => new ProductImage
                    {
                        IdProducts = id,
                        Url = url,
                        IsPrimary = index == 0,
                        Position = index
                    }).ToList();

                    _context.ProductImages.AddRange(newImages);
                }
            }

            // Update variants if provided
            if (request.Variants != null)
            {
                // Lấy danh sách variant IDs cũ
                var oldVariantIds = await _context.ProductVariants
                    .Where(pv => pv.IdProducts == id)
                    .Select(pv => pv.IdProductVariants)
                    .ToListAsync();

                if (oldVariantIds.Any())
                {
                    // Xóa cart_items liên quan đến variants cũ trước
                    var relatedCartItems = _context.CartItems
                        .Where(ci => oldVariantIds.Contains(ci.IdProductVariants));
                    _context.CartItems.RemoveRange(relatedCartItems);

                    // Xóa variants cũ
                    var oldVariants = _context.ProductVariants.Where(pv => pv.IdProducts == id);
                    _context.ProductVariants.RemoveRange(oldVariants);
                    
                    await _context.SaveChangesAsync();
                }

                if (request.Variants.Count > 0)
                {
                    var newVariants = request.Variants.Select((v, index) => new ProductVariant
                    {
                        IdProducts = id,
                        Color = v.Color,
                        Size = v.Size,
                        StockQuantity = v.StockQuantity,
                        Price = v.Price,
                        SalePrice = v.SalePrice,
                        Sku = string.IsNullOrWhiteSpace(v.Sku) 
                            ? $"SKU-{id}-{index}-{DateTime.Now.Ticks}" 
                            : v.Sku,
                        Status = v.Status ?? "active"
                    }).ToList();

                    _context.ProductVariants.AddRange(newVariants);
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Cập nhật sản phẩm thành công" });
        }

        // DELETE: api/admin/AdminProducts/{id}
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> DeleteProduct(long id)
        {
            if (!IsAdmin()) return Forbid();

            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();

            // Soft delete -> đặt về inactive
            product.Status = "inactive";
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Xóa sản phẩm thành công" });
        }

        private bool IsAdmin()
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            return role == "admin";
        }

        private string GenerateSlug(string name)
        {
            return name.ToLower()
                .Replace(" ", "-")
                .Replace("đ", "d")
                .Replace("ê", "e")
                .Replace("ô", "o")
                .Replace("ơ", "o")
                .Replace("ư", "u")
                .Replace("ă", "a")
                .Replace("â", "a")
                .Replace("ệ", "e")
                + "-" + DateTime.Now.Ticks.ToString().Substring(10);
        }

        private string GenerateSku()
        {
            return "SKU-" + DateTime.Now.Ticks.ToString().Substring(10);
        }

        private string? NormalizeStatus(string? status)
        {
            if (string.IsNullOrWhiteSpace(status)) return null;
            var lower = status.Trim().ToLower();
            return lower switch
            {
                "active" => "active",
                "inactive" => "inactive",
                _ => null // bỏ qua các giá trị khác
            };
        }
    }

    public class CreateProductRequest
    {
        public string Name { get; set; } = null!;
        public string? Slug { get; set; }
        public string? ShortDescription { get; set; }
        public string? Description { get; set; }
        public string? Sku { get; set; }
        public decimal Price { get; set; }
        public decimal? SalePrice { get; set; }
        public string? Status { get; set; }
        public long IdCategories { get; set; }
        public List<string>? Images { get; set; }
        public List<ProductVariantRequest>? Variants { get; set; }
    }

    public class UpdateProductRequest
    {
        public string? Name { get; set; }
        public string? Slug { get; set; }
        public string? ShortDescription { get; set; }
        public string? Description { get; set; }
        public string? Sku { get; set; }
        public decimal? Price { get; set; }
        public decimal? SalePrice { get; set; }
        public string? Status { get; set; }
        public long? IdCategories { get; set; }
        public List<string>? Images { get; set; }
        public List<ProductVariantRequest>? Variants { get; set; }
    }

    public class ProductVariantRequest
    {
        public string? Color { get; set; }
        public string? Size { get; set; }
        public int StockQuantity { get; set; }
        public decimal? Price { get; set; }
        public decimal? SalePrice { get; set; }
        public string? Sku { get; set; }
        public string? Status { get; set; }
    }
}

