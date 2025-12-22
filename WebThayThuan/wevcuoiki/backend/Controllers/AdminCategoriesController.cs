using Backend_WebBanHang.Data;
using Backend_WebBanHang.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend_WebBanHang.Controllers
{
    [ApiController]
    [Route("api/admin/[controller]")]
    [Authorize]
    public class AdminCategoriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminCategoriesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/admin/AdminCategories/tree
        [HttpGet("tree")]
        public async Task<IActionResult> GetCategoryTree(
            [FromQuery] string? keyword = null,
            [FromQuery] string? status = null)
        {
            if (!IsAdmin()) return Forbid();

            var rows = await _context.Categories
                .AsNoTracking()
                .Select(c => new
                {
                    c.IdCategories,
                    c.ParentIdCategories,
                    c.Name,
                    c.Slug,
                    Status = c.Status ?? "active",
                    c.img
                })
                .ToListAsync();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var kw = keyword.Trim().ToLower();
                rows = rows.Where(c =>
                    (c.Name != null && c.Name.ToLower().Contains(kw)) ||
                    (c.Slug != null && c.Slug.ToLower().Contains(kw))
                ).ToList();
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                var normStatus = NormalizeStatus(status);
                if (normStatus != null)
                {
                    rows = rows.Where(c => (c.Status ?? "active") == normStatus).ToList();
                }
            }

            var byId = rows.ToDictionary(x => x.IdCategories);
            var childrenMap = rows
                .Where(x => x.ParentIdCategories.HasValue)
                .GroupBy(x => x.ParentIdCategories!.Value)
                .ToDictionary(g => g.Key, g => g.Select(x => x.IdCategories).ToList());

            var productCount = await _context.Products
                .AsNoTracking()
                .GroupBy(p => p.IdCategories)
                .Select(g => new { IdCategories = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.IdCategories, x => x.Count);

            List<object> BuildTree(long? parentId)
            {
                var roots = rows.Where(c => c.ParentIdCategories == parentId).OrderBy(c => c.Name).ToList();
                var result = new List<object>();

                foreach (var n in roots)
                {
                    childrenMap.TryGetValue(n.IdCategories, out var kidIds);
                    kidIds ??= new List<long>();

                    var children = BuildTree(n.IdCategories);

                    productCount.TryGetValue(n.IdCategories, out var count);

                    result.Add(new
                    {
                        idCategories = n.IdCategories,
                        parentIdCategories = n.ParentIdCategories,
                        name = n.Name,
                        slug = n.Slug,
                        status = n.Status,
                        img = n.img,
                        productCount = count,
                        children
                    });
                }

                return result;
            }

            var tree = BuildTree(null);
            return Ok(tree);
        }

        // GET: api/admin/AdminCategories/{id}
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetCategory(long id)
        {
            if (!IsAdmin()) return Forbid();

            var c = await _context.Categories.FindAsync(id);
            if (c == null) return NotFound();

            return Ok(new
            {
                c.IdCategories,
                c.ParentIdCategories,
                c.Name,
                c.Slug,
                Status = c.Status ?? "active",
                c.img
            });
        }

        public class CategoryRequest
        {
            public string Name { get; set; } = null!;
            public string? Slug { get; set; }
            public long? ParentIdCategories { get; set; }
            public string? Status { get; set; }
            public string? Img { get; set; }
        }

        // POST: api/admin/AdminCategories
        [HttpPost]
        public async Task<IActionResult> CreateCategory([FromBody] CategoryRequest request)
        {
            if (!IsAdmin()) return Forbid();
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var normalizedStatus = NormalizeStatus(request.Status) ?? "active";

            var cat = new Categorie
            {
                Name = request.Name,
                Slug = string.IsNullOrWhiteSpace(request.Slug) ? GenerateSlug(request.Name) : request.Slug!,
                ParentIdCategories = request.ParentIdCategories,
                Status = normalizedStatus,
                img = request.Img,
                CreatedAt = DateTime.Now
            };

            _context.Categories.Add(cat);
            await _context.SaveChangesAsync();

            return Ok(new { IdCategories = cat.IdCategories, Message = "Tạo danh mục thành công" });
        }

        // PUT: api/admin/AdminCategories/{id}
        [HttpPut("{id:long}")]
        public async Task<IActionResult> UpdateCategory(long id, [FromBody] CategoryRequest request)
        {
            if (!IsAdmin()) return Forbid();

            var cat = await _context.Categories.FindAsync(id);
            if (cat == null) return NotFound();

            cat.Name = string.IsNullOrWhiteSpace(request.Name) ? cat.Name : request.Name;
            cat.Slug = string.IsNullOrWhiteSpace(request.Slug)
                ? cat.Slug
                : request.Slug!;

            cat.ParentIdCategories = request.ParentIdCategories;

            var normalizedStatus = NormalizeStatus(request.Status);
            if (normalizedStatus != null) cat.Status = normalizedStatus;

            if (request.Img != null) cat.img = request.Img;

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Cập nhật danh mục thành công" });
        }

        // DELETE: api/admin/AdminCategories/{id}
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> DeleteCategory(long id)
        {
            if (!IsAdmin()) return Forbid();

            var cat = await _context.Categories.FindAsync(id);
            if (cat == null) return NotFound();

            // Soft delete -> inactive
            cat.Status = "inactive";
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đã ẩn danh mục (inactive)" });
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
                .Replace("â", "a");
        }

        private string? NormalizeStatus(string? status)
        {
            if (string.IsNullOrWhiteSpace(status)) return null;
            var lower = status.Trim().ToLower();
            return lower switch
            {
                "active" => "active",
                "inactive" => "inactive",
                _ => null
            };
        }
    }
}




