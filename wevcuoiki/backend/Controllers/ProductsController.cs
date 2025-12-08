using Backend_WebBanHang.Data;
using Backend_WebBanHang.Models;
using Backend_WebBanHang.DTOs.Common;
using Backend_WebBanHang.DTOs.Products;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend_WebBanHang.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // cả controller yêu cầu token, nhưng ta sẽ AllowAnonymous cho các action public
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductsController(AppDbContext context)
        {
            _context = context;
        }
        //getallpro
        [AllowAnonymous]
        [HttpGet("all")]
        public async Task<IActionResult> GetAllNoPaging()
        {
            var items = await _context.Products
                .AsNoTracking()
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    p.IdProducts,
                    p.IdCategories,
                    p.Name,
                    p.Slug,
                    p.ShortDescription,
                    p.Description,
                    p.Sku,
                    p.Price,
                    p.SalePrice,
                    p.StockQuantity,
                    p.Status,
                    p.CreatedAt,
                    p.UpdatedAt,
                    ThumbnailUrl = _context.ProductImages
                        .Where(i => i.IdProducts == p.IdProducts)
                        .OrderByDescending(i => i.IsPrimary)
                        .ThenBy(i => i.Position)
                        .Select(i => i.Url)
                        .FirstOrDefault(),
                    AverageRating = _context.ProductReviews
                        .Where(r => r.IdProducts == p.IdProducts && r.Status == "active")
                        .Select(r => (double?)r.Rating)
                        .Average(),
                    ReviewCount = _context.ProductReviews
                        .Where(r => r.IdProducts == p.IdProducts && r.Status == "active")
                        .Count()
                })
                .ToListAsync();

            return Ok(items);
        }

        // GET: api/Products
        // ?page=1&pageSize=12&keyword=ao&categoryId=1&minPrice=100000&maxPrice=500000&sort=price_asc
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAllForm(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12,
            [FromQuery] string? keyword = null,
            [FromQuery] long? categoryId = null,
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null,
            [FromQuery] string? sort = "newest")
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0 || pageSize > 100) pageSize = 12;

            var query = _context.Products.AsQueryable();

            // Tìm theo tên / slug
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var kw = keyword.Trim();
                query = query.Where(p =>
                    p.Name.Contains(kw) ||
                    p.Slug.Contains(kw));
            }

            // Lọc theo category
            if (categoryId.HasValue)
            {
                query = query.Where(p => p.IdCategories == categoryId.Value);
            }

            // Lọc theo khoảng giá (dùng giá thực tế = sale_price ?? price)
            if (minPrice.HasValue)
            {
                query = query.Where(p => (p.SalePrice ?? p.Price) >= minPrice.Value);
            }

            if (maxPrice.HasValue)
            {
                query = query.Where(p => (p.SalePrice ?? p.Price) <= maxPrice.Value);
            }

            // Sort
            switch (sort?.ToLower())
            {
                case "price_asc":
                    query = query.OrderBy(p => p.SalePrice ?? p.Price);
                    break;
                case "price_desc":
                    query = query.OrderByDescending(p => p.SalePrice ?? p.Price);
                    break;
                case "name_asc":
                    query = query.OrderBy(p => p.Name);
                    break;
                case "name_desc":
                    query = query.OrderByDescending(p => p.Name);
                    break;
                case "newest":
                default:
                    query = query.OrderByDescending(p => p.CreatedAt);
                    break;
            }

            var totalItems = await query.CountAsync();

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new ProductListItemDto
                {
                    IdProducts = p.IdProducts,
                    Name = p.Name,
                    Slug = p.Slug,
                    Price = p.Price,
                    SalePrice = p.SalePrice,
                    IdCategories = p.IdCategories,
                    ShortDescription = p.ShortDescription,
                    ThumbnailUrl = _context.ProductImages
                        .Where(i => i.IdProducts == p.IdProducts && i.IsPrimary == true)
                        .OrderBy(i => i.Position)
                        .Select(i => i.Url)
                        .FirstOrDefault(),
                    AverageRating = _context.ProductReviews
                        .Where(r => r.IdProducts == p.IdProducts && r.Status == "active")
                        .Select(r => (double?)r.Rating)
                        .Average(),
                    ReviewCount = _context.ProductReviews
                        .Where(r => r.IdProducts == p.IdProducts && r.Status == "active")
                        .Count()
                })
                .ToListAsync();

            // Populate AvailableColors and AvailableSizes
            foreach (var item in items)
            {
                var variants = await _context.ProductVariants
                    .Where(v => v.IdProducts == item.IdProducts)
                    .ToListAsync();

                item.AvailableColors = variants
                    .Where(v => !string.IsNullOrEmpty(v.Color))
                    .Select(v => v.Color!)
                    .Distinct()
                    .ToList();

                item.AvailableSizes = variants
                    .Where(v => !string.IsNullOrEmpty(v.Size))
                    .Select(v => v.Size!)
                    .Distinct()
                    .ToList();
            }

            var result = new PagedResult<ProductListItemDto>
            {
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
                Items = items
            };

            return Ok(result);
        }

        // GET: api/Products/5
        [AllowAnonymous]
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.IdProducts == id);

            if (product == null) return NotFound();

            // Lấy category name
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.IdCategories == product.IdCategories);

            // Lấy images
            var images = await _context.ProductImages
                .Where(i => i.IdProducts == id)
                .OrderByDescending(i => i.IsPrimary)
                .ThenBy(i => i.Position)
                .Select(i => new DTOs.Products.ProductImageDto
                {
                    IdProductImages = i.IdProductImages,
                    Url = i.Url,
                    IsPrimary = i.IsPrimary,
                    Position = i.Position
                })
                .ToListAsync();

            // Lấy variants
            var variants = await _context.ProductVariants
                .Where(v => v.IdProducts == id)
                .Select(v => new DTOs.Products.ProductVariantDto
                {
                    IdProductVariants = v.IdProductVariants,
                    Sku = v.Sku,
                    Size = v.Size,
                    Color = v.Color,
                    StockQuantity = v.StockQuantity,
                    Price = v.Price,
                    SalePrice = v.SalePrice,
                    Status = v.Status
                })
                .ToListAsync();

            // Tính average rating
            var averageRating = await _context.ProductReviews
                .Where(r => r.IdProducts == id && r.Status == "active")
                .Select(r => (double?)r.Rating)
                .AverageAsync();

            var reviewCount = await _context.ProductReviews
                .Where(r => r.IdProducts == id && r.Status == "active")
                .CountAsync();

            // Tính số lượng đã bán (từ order_items thông qua product_variants)
            var soldQuantity = await (from oi in _context.OrderItems
                                     join v in _context.ProductVariants on oi.IdProductVariants equals v.IdProductVariants
                                     join o in _context.Orders on oi.IdOrders equals o.IdOrders
                                     where v.IdProducts == id && o.Status != "cancelled"
                                     select oi.Quantity)
                                     .SumAsync();

            var dto = new DTOs.Products.ProductDetailsDto
            {
                IdProducts = product.IdProducts,
                Name = product.Name,
                Slug = product.Slug,
                ShortDescription = product.ShortDescription,
                Description = product.Description,
                Sku = product.Sku,
                Price = product.Price,
                SalePrice = product.SalePrice,
                StockQuantity = product.StockQuantity,
                Status = product.Status,
                IdCategories = product.IdCategories,
                CategoryName = category?.Name,
                AverageRating = averageRating,
                ReviewCount = reviewCount,
                SoldQuantity = soldQuantity,
                Images = images,
                Variants = variants
            };

            return Ok(dto);
        }

        // POST: api/Products
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Product model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            model.CreatedAt = DateTime.Now;
            _context.Products.Add(model);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = model.IdProducts }, model);
        }

        // PUT: api/Products/5
        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(long id, [FromBody] Product model)
        {
            if (id != model.IdProducts) return BadRequest("Id không khớp.");

            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();

            product.IdCategories = model.IdCategories;
            product.Name = model.Name;
            product.Slug = model.Slug;
            product.ShortDescription = model.ShortDescription;
            product.Description = model.Description;
            product.Sku = model.Sku;
            product.Price = model.Price;
            product.SalePrice = model.SalePrice;
            product.StockQuantity = model.StockQuantity;
            product.Status = model.Status;
            product.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Products/5
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
