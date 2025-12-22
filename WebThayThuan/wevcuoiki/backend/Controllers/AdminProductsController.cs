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

            // Chỉ lấy sản phẩm theo status (mặc định chỉ lấy active)
            var query = _context.Products.AsQueryable();
            var normalizedStatus = NormalizeStatus(status) ?? "active";
            query = query.Where(p => p.Status == normalizedStatus);

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
                        .Select(i => i.Url)
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
                    i.Url,
                    i.IsPrimary,
                    i.Position,
                    i.color
                })
                .ToListAsync();

            var variants = await _context.ProductVariants
                .Where(v => v.IdProducts == id)
                .Select(v => new
                {
                    v.IdProductVariants,
                    v.Color,
                    v.Size,
                    v.StockQuantity,
                    v.Price,
                    v.SalePrice,
                    v.Sku,
                    v.Status
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
                var variants = request.Variants.Select(v => new ProductVariant
                {
                    IdProducts = product.IdProducts,
                    Color = v.Color,
                    Size = v.Size,
                    StockQuantity = v.StockQuantity,
                    Price = v.Price,
                    SalePrice = v.SalePrice,
                    Sku = v.Sku,
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

