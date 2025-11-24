using Backend_WebBanHang.Data;
using Backend_WebBanHang.DTOs.Categories;
using Backend_WebBanHang.Models;
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

        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] long? parentId = null,
            [FromQuery] string? status = "active")
        {
            var query = _context.Categories.AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(c => c.Status == status);
            }

            if (parentId.HasValue)
            {
                query = query.Where(c => c.ParentIdCategories == parentId.Value);
            }
            else
            {
                query = query.Where(c => c.ParentIdCategories == null);
            }

            var items = await query
                .OrderBy(c => c.Position)
                .ThenBy(c => c.Name)
                .Select(c => new CategoryDto
                {
                    IdCategories = c.IdCategories,
                    ParentIdCategories = c.ParentIdCategories,
                    Name = c.Name,
                    Slug = c.Slug,
                    Description = c.Description,
                    Position = c.Position,
                    Status = c.Status
                })
                .ToListAsync();

            return Ok(items);
        }

        [AllowAnonymous]
        [HttpGet("tree")]
        public async Task<IActionResult> GetTree([FromQuery] string? status = "active")
        {
            var query = _context.Categories.AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(c => c.Status == status);
            }

            var categories = await query
                .OrderBy(c => c.Position)
                .ThenBy(c => c.Name)
                .ToListAsync();

            var dict = new Dictionary<long, CategoryTreeDto>();
            var roots = new List<CategoryTreeDto>();

            foreach (var c in categories)
            {
                var node = new CategoryTreeDto
                {
                    IdCategories = c.IdCategories,
                    Name = c.Name,
                    Slug = c.Slug,
                    Position = c.Position,
                    Status = c.Status
                };

                dict[c.IdCategories] = node;
            }

            foreach (var c in categories)
            {
                var node = dict[c.IdCategories];

                if (c.ParentIdCategories.HasValue &&
                    dict.TryGetValue(c.ParentIdCategories.Value, out var parentNode))
                {
                    parentNode.Children.Add(node);
                }
                else
                {
                    roots.Add(node);
                }
            }

            return Ok(roots);
        }

        [AllowAnonymous]
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var c = await _context.Categories.FirstOrDefaultAsync(x => x.IdCategories == id);
            if (c == null) return NotFound();

            var dto = new CategoryDto
            {
                IdCategories = c.IdCategories,
                ParentIdCategories = c.ParentIdCategories,
                Name = c.Name,
                Slug = c.Slug,
                Description = c.Description,
                Position = c.Position,
                Status = c.Status
            };

            return Ok(dto);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CategoryDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var entity = new Categorie
            {
                ParentIdCategories = model.ParentIdCategories,
                Name = model.Name,
                Slug = model.Slug,
                Description = model.Description,
                Position = model.Position ?? 0,
                Status = model.Status ?? "active",
                CreatedAt = DateTime.Now
            };

            _context.Categories.Add(entity);
            await _context.SaveChangesAsync();

            model.IdCategories = entity.IdCategories;
            model.Position = entity.Position;
            model.Status = entity.Status;

            return CreatedAtAction(nameof(GetById), new { id = entity.IdCategories }, model);
        }

        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(long id, [FromBody] CategoryDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (id != model.IdCategories) return BadRequest("Id không khớp.");

            var entity = await _context.Categories.FindAsync(id);
            if (entity == null) return NotFound();

            entity.ParentIdCategories = model.ParentIdCategories;
            entity.Name = model.Name;
            entity.Slug = model.Slug;
            entity.Description = model.Description;
            entity.Position = model.Position ?? entity.Position;
            entity.Status = model.Status ?? entity.Status;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id)
        {
            var entity = await _context.Categories.FindAsync(id);
            if (entity == null) return NotFound();

            var hasChildren = await _context.Categories.AnyAsync(c => c.ParentIdCategories == id);
            if (hasChildren)
                return BadRequest("Không thể xóa vì còn danh mục con.");

            var hasProducts = await _context.Products.AnyAsync(p => p.IdCategories == id);
            if (hasProducts)
                return BadRequest("Không thể xóa vì vẫn còn sản phẩm thuộc danh mục này.");

            _context.Categories.Remove(entity);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
