using Backend_WebBanHang.Data;
using Backend_WebBanHang.DTOs.Navigation;
using Backend_WebBanHang.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend_WebBanHang.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class NavigationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NavigationController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/navigation/nav
        [HttpGet("nav")]
        public async Task<IActionResult> GetNavigation()
        {
            try
            {
                // Lấy tất cả root categories (parent_id_categories IS NULL)
                var rootCategories = await _context.Categories
                    .Where(c => c.ParentIdCategories == null && (c.Status == "active" || c.Status == null))
                    .OrderBy(c => c.Name)
                    .ToListAsync();

                var result = new List<NavCategoryDto>();

                foreach (var root in rootCategories)
                {
                    var navCategory = new NavCategoryDto
                    {
                        Id = root.IdCategories,
                        Name = root.Name,
                        Slug = root.Slug,
                        Children = new List<NavCategoryDto>(),
                        FeaturedProducts = new List<NavProductDto>()
                    };

                    // Lấy children (1-2 cấp) bằng recursive CTE
                    var allChildCategoryIds = await GetAllChildCategoryIds(root.IdCategories);
                    allChildCategoryIds.Add(root.IdCategories); // Bao gồm cả root

                    // Build children tree (chỉ 2 cấp)
                    var directChildren = await _context.Categories
                        .Where(c => c.ParentIdCategories == root.IdCategories && (c.Status == "active" || c.Status == null))
                        .OrderBy(c => c.Name)
                        .ToListAsync();

                    foreach (var child in directChildren)
                    {
                        var childDto = new NavCategoryDto
                        {
                            Id = child.IdCategories,
                            Name = child.Name,
                            Slug = child.Slug,
                            Children = new List<NavCategoryDto>()
                        };

                        // Lấy children cấp 2
                        var grandChildren = await _context.Categories
                            .Where(c => c.ParentIdCategories == child.IdCategories && (c.Status == "active" || c.Status == null))
                            .OrderBy(c => c.Name)
                            .ToListAsync();

                        foreach (var grandChild in grandChildren)
                        {
                            childDto.Children.Add(new NavCategoryDto
                            {
                                Id = grandChild.IdCategories,
                                Name = grandChild.Name,
                                Slug = grandChild.Slug,
                                Children = new List<NavCategoryDto>()
                            });
                        }

                        navCategory.Children.Add(childDto);
                    }

                    // Lấy tối đa 3 sản phẩm featured từ tất cả categories con
                    var productIds = await _context.Products
                        .Where(p => allChildCategoryIds.Contains(p.IdCategories) && p.Status == "active")
                        .OrderByDescending(p => p.CreatedAt)
                        .Take(3)
                        .Select(p => p.IdProducts)
                        .ToListAsync();

                    var featuredProducts = await _context.Products
                        .Where(p => productIds.Contains(p.IdProducts))
                        .Select(p => new
                        {
                            p.IdProducts,
                            p.Name,
                            p.Slug,
                            p.Price,
                            p.SalePrice
                        })
                        .ToListAsync();

                    // Lấy ảnh cho từng sản phẩm
                    var productDtos = new List<NavProductDto>();
                    foreach (var p in featuredProducts)
                    {
                        // Tìm ảnh primary trước
                        var primaryImage = await _context.ProductImages
                            .Where(img => img.IdProducts == p.IdProducts && img.IsPrimary == true)
                            .Select(img => img.Url)
                            .FirstOrDefaultAsync();

                        // Nếu không có primary, lấy ảnh đầu tiên theo position
                        if (string.IsNullOrEmpty(primaryImage))
                        {
                            primaryImage = await _context.ProductImages
                                .Where(img => img.IdProducts == p.IdProducts)
                                .OrderBy(img => img.Position ?? 0)
                                .Select(img => img.Url)
                                .FirstOrDefaultAsync();
                        }

                        productDtos.Add(new NavProductDto
                        {
                            Id = p.IdProducts,
                            Name = p.Name,
                            Slug = p.Slug,
                            Price = p.SalePrice ?? p.Price,
                            ImageUrl = primaryImage
                        });
                    }

                    navCategory.FeaturedProducts = productDtos;

                    result.Add(navCategory);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy dữ liệu navigation", error = ex.Message });
            }
        }

        // Hàm đệ quy để lấy tất cả category IDs con
        private async Task<List<long>> GetAllChildCategoryIds(long parentId)
        {
            var allIds = new List<long>();
            await GetChildIdsRecursive(parentId, allIds);
            return allIds;
        }

        private async Task GetChildIdsRecursive(long parentId, List<long> result)
        {
            var children = await _context.Categories
                .Where(c => c.ParentIdCategories == parentId)
                .Select(c => c.IdCategories)
                .ToListAsync();

            foreach (var childId in children)
            {
                result.Add(childId);
                await GetChildIdsRecursive(childId, result);
            }
        }
    }
}

