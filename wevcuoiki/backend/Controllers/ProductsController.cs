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
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAllForm(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12,
            [FromQuery] string? keyword = null,
            [FromQuery] long? categoryId = null,
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null,
            [FromQuery] string? colors = null,
            [FromQuery] string? sizes = null,
            [FromQuery] string? sort = "newest")
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0 || pageSize > 100) pageSize = 12;

            IQueryable<Product> query = _context.Products.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var kw = keyword.Trim();
                query = query.Where(p => p.Name.Contains(kw) || p.Slug.Contains(kw));
            }

            // categoryId=root => lấy cả con/cháu
            if (categoryId.HasValue)
            {
                var rows = await _context.Categories.AsNoTracking()
                    .Select(c => new { c.IdCategories, c.ParentIdCategories })
                    .ToListAsync();

                var childrenMap = rows
                    .Where(x => x.ParentIdCategories.HasValue)
                    .GroupBy(x => x.ParentIdCategories!.Value)
                    .ToDictionary(g => g.Key, g => g.Select(x => x.IdCategories).ToList());

                var ids = new HashSet<long>();
                var stack = new Stack<long>();
                stack.Push(categoryId.Value);

                while (stack.Count > 0)
                {
                    var cur = stack.Pop();
                    if (!ids.Add(cur)) continue;

                    if (childrenMap.TryGetValue(cur, out var kids))
                        foreach (var k in kids) stack.Push(k);
                }

                query = query.Where(p => ids.Contains(p.IdCategories));
            }

            if (minPrice.HasValue)
                query = query.Where(p => (p.SalePrice ?? p.Price) >= minPrice.Value);

            if (maxPrice.HasValue)
                query = query.Where(p => (p.SalePrice ?? p.Price) <= maxPrice.Value);

            // ====== FILTER theo màu / size (dựa vào product_variant) ======
            var colorList = string.IsNullOrWhiteSpace(colors)
                ? new List<string>()
                : colors.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

            var sizeList = string.IsNullOrWhiteSpace(sizes)
                ? new List<string>()
                : sizes.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

            if (colorList.Count > 0)
            {
                query = query.Where(p =>
                    _context.ProductVariants.Any(v => v.IdProducts == p.IdProducts && v.Color != null && colorList.Contains(v.Color)));
            }

            if (sizeList.Count > 0)
            {
                query = query.Where(p =>
                    _context.ProductVariants.Any(v => v.IdProducts == p.IdProducts && v.Size != null && sizeList.Contains(v.Size)));
            }

            // Sort
            query = (sort?.ToLower()) switch
            {
                "price_asc" => query.OrderBy(p => p.SalePrice ?? p.Price),
                "price_desc" => query.OrderByDescending(p => p.SalePrice ?? p.Price),
                "name_asc" => query.OrderBy(p => p.Name),
                "name_desc" => query.OrderByDescending(p => p.Name),
                _ => query.OrderByDescending(p => p.CreatedAt)
            };

            var totalItems = await query.CountAsync();

            // ====== base list ======
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

                    StockQuantity = 0,

                    ThumbnailUrl = _context.ProductImages
                        .Where(i => i.IdProducts == p.IdProducts)
                        .OrderByDescending(i => (i.IsPrimary ?? false))
                        .ThenBy(i => (i.Position ?? 0))
                        .Select(i => i.Url)
                        .FirstOrDefault(),

                    AverageRating = _context.ProductReviews
                        .Where(r => r.IdProducts == p.IdProducts && r.Status == "visible")
                        .Select(r => (double?)r.Rating)
                        .Average(),

                    ReviewCount = _context.ProductReviews
                        .Where(r => r.IdProducts == p.IdProducts && r.Status == "visible")
                        .Count(),

                    AvailableColors = new List<string>(),
                    AvailableSizes = new List<string>(),
                    ImagesByColor = new Dictionary<string, List<string>>(),
                    ColorThumbs = new List<ColorThumbDto>()
                })
                .ToListAsync();

            if (items.Count == 0)
            {
                return Ok(new PagedResult<ProductListItemDto>
                {
                    Page = page,
                    PageSize = pageSize,
                    TotalItems = totalItems,
                    TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
                    Items = items
                });
            }

            var productIds = items.Select(x => x.IdProducts).ToList();

            // ====== variants => colors/sizes + tồn kho tổng ======
            var variantRows = await _context.ProductVariants.AsNoTracking()
                .Where(v => productIds.Contains(v.IdProducts))
                .Select(v => new { v.IdProducts, v.Color, v.Size, v.StockQuantity })
                .ToListAsync();

            foreach (var it in items)
            {
                it.AvailableColors = variantRows
                    .Where(v => v.IdProducts == it.IdProducts && !string.IsNullOrEmpty(v.Color))
                    .Select(v => v.Color!)
                    .Distinct()
                    .ToList();

                it.AvailableSizes = variantRows
                    .Where(v => v.IdProducts == it.IdProducts && !string.IsNullOrEmpty(v.Size))
                    .Select(v => v.Size!)
                    .Distinct()
                    .ToList();

                it.StockQuantity = variantRows
                    .Where(v => v.IdProducts == it.IdProducts)
                    .Sum(v => (int?)v.StockQuantity) ?? 0;
            }

            // ====== imagesByColor + color thumbs + fallback thumbnail ======
            var imgRows = await _context.ProductImages.AsNoTracking()
                .Where(i => productIds.Contains(i.IdProducts) && i.color != null && i.color != "")
                .Select(i => new { i.IdProducts, Color = i.color!, i.Url, i.IsPrimary, i.Position })
                .ToListAsync();

            foreach (var it in items)
            {
                var rows = imgRows
                    .Where(r => r.IdProducts == it.IdProducts)
                    .OrderByDescending(r => (r.IsPrimary ?? false))
                    .ThenBy(r => (r.Position ?? 0))
                    .ToList();

                it.ImagesByColor = rows
                    .GroupBy(r => r.Color)
                    .ToDictionary(
                        g => g.Key,
                        g => g.OrderByDescending(x => (x.IsPrimary ?? false))
                              .ThenBy(x => (x.Position ?? 0))
                              .Select(x => x.Url)
                              .Where(u => !string.IsNullOrEmpty(u))
                              .Distinct()
                              .ToList()
                    );

                it.ColorThumbs = it.ImagesByColor
                    .Select(kv => new ColorThumbDto { Color = kv.Key, ThumbUrl = kv.Value.FirstOrDefault() })
                    .ToList();

                if (string.IsNullOrWhiteSpace(it.ThumbnailUrl))
                    it.ThumbnailUrl = rows.Select(x => x.Url).FirstOrDefault();
            }

            return Ok(new PagedResult<ProductListItemDto>
            {
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
                Items = items
            });
        }











        // GET: api/Products/5
        [AllowAnonymous]
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            return await GetDetailsDto(p => p.IdProducts == id);
        }

        // GET: api/Products/by-slug/abc
        [AllowAnonymous]
        [HttpGet("by-slug/{slug}")]
        public async Task<IActionResult> GetBySlug(string slug)
        {
            if (string.IsNullOrWhiteSpace(slug)) return BadRequest("slug is required");
            var s = slug.Trim();
            return await GetDetailsDto(p => p.Slug == s);
        }

        private async Task<IActionResult> GetDetailsDto(System.Linq.Expressions.Expression<Func<Product, bool>> predicate)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(predicate);

            if (product == null) return NotFound();

            var productId = product.IdProducts;

            // Lấy category name
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.IdCategories == product.IdCategories);

            // Lấy images
            var images = await _context.ProductImages
                .Where(i => i.IdProducts == productId)
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
                .Where(v => v.IdProducts == productId)
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

            // tồn kho = tổng tồn kho variants
            var totalVariantStock = variants.Sum(v => (int?)v.StockQuantity) ?? 0;

            // Tính average rating
            var averageRating = await _context.ProductReviews
                .Where(r => r.IdProducts == productId && r.Status == "active")
                .Select(r => (double?)r.Rating)
                .AverageAsync();

            var reviewCount = await _context.ProductReviews
                .Where(r => r.IdProducts == productId && r.Status == "active")
                .CountAsync();

            // Tính số lượng đã bán (từ order_items thông qua product_variants)
            var soldQuantity = await (from oi in _context.OrderItems
                                     join v in _context.ProductVariants on oi.IdProductVariants equals v.IdProductVariants
                                     join o in _context.Orders on oi.IdOrders equals o.IdOrders
                                     where v.IdProducts == productId && o.Status != "cancelled"
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
                StockQuantity = totalVariantStock,
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
            product.Status = model.Status;
           

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
