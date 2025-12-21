using Backend_WebBanHang.Data;
using Backend_WebBanHang.DTOs.Categories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend_WebBanHang.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CategoriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CategoriesController(AppDbContext context)
        {
            _context = context;
        }

        private sealed class CategoryRowDto
        {
            public long IdCategories { get; set; }
            public long? ParentIdCategories { get; set; }
            public string Name { get; set; } = null!;
            public string Slug { get; set; } = null!;
            public string? Status { get; set; }
            public string? Img { get; set; }
        }

        // GET: api/Categories/by-slug/ao-thu-dong
        [AllowAnonymous]
        [HttpGet("by-slug/{slug}")]
        public async Task<IActionResult> GetBySlug([FromRoute] string slug)
        {
            if (string.IsNullOrWhiteSpace(slug)) return BadRequest("slug is required");

            var s = slug.Trim();

            var cat = await _context.Categories
                .AsNoTracking()
                .Where(c => c.Slug == s)
                .Select(c => new CategoryDto
                {
                    IdCategories = c.IdCategories,
                    ParentIdCategories = c.ParentIdCategories,
                    Name = c.Name,
                    Slug = c.Slug,
                    Status = c.Status,
                    Img = c.img
                })
                .FirstOrDefaultAsync();

            if (cat == null) return NotFound();
            return Ok(cat);
        }

        // GET: api/Categories/tree/by-slug/ao-thu-dong
        [AllowAnonymous]
        [HttpGet("tree/by-slug/{slug}")]
        public async Task<IActionResult> GetTreeBySlug([FromRoute] string slug)
        {
            if (string.IsNullOrWhiteSpace(slug)) return BadRequest("slug is required");

            var s = slug.Trim();

            var rootId = await _context.Categories.AsNoTracking()
                .Where(c => c.Slug == s)
                .Select(c => (long?)c.IdCategories)
                .FirstOrDefaultAsync();

            if (!rootId.HasValue) return NotFound();

            var rows = await _context.Categories.AsNoTracking()
                .Select(c => new CategoryRowDto
                {
                    IdCategories = c.IdCategories,
                    ParentIdCategories = c.ParentIdCategories,
                    Name = c.Name,
                    Slug = c.Slug,
                    Status = c.Status,
                    Img = c.img
                })
                .ToListAsync();

            var byId = rows.ToDictionary(x => x.IdCategories);

            var childrenMap = rows
                .Where(x => x.ParentIdCategories.HasValue)
                .GroupBy(x => x.ParentIdCategories!.Value)
                .ToDictionary(g => g.Key, g => g.Select(x => x.IdCategories).ToList());

            CategoryTreeDto Build(long id)
            {
                var n = byId[id];

                childrenMap.TryGetValue(id, out var kidIds);
                kidIds ??= new List<long>();

                return new CategoryTreeDto
                {
                    Id = n.IdCategories,
                    ParentId = n.ParentIdCategories,
                    Name = n.Name,
                    Slug = n.Slug,
                    Status = n.Status,
                    Img = n.Img,
                    Children = kidIds.Select(Build).ToList()
                };
            }

            return Ok(Build(rootId.Value));
        }
    }
}
