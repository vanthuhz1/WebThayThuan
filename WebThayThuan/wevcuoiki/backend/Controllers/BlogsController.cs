using Backend_WebBanHang.Data;
using Backend_WebBanHang.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Net.Http;
using System.Linq;

namespace Backend_WebBanHang.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class BlogsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BlogsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Blogs
        [HttpGet]
        public async Task<IActionResult> GetBlogs([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0 || pageSize > 50) pageSize = 10;

            var query = _context.Blogs
                .Where(b => b.Status == "published" || b.Status == "active")
                .AsQueryable();

            var totalItems = await query.CountAsync();

            var blogs = await query
                .OrderByDescending(b => b.PublishedAt ?? DateTime.MinValue)
                .ThenByDescending(b => b.IdBlogs)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new
                {
                    b.IdBlogs,
                    b.Title,
                    b.Slug,
                    b.Thumbnail,
                    b.Excerpt,
                    b.PublishedAt,
                    AuthorName = _context.Users
                        .Where(u => u.IdUsers == b.IdUsers)
                        .Select(u => u.FullName)
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(new
            {
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
                Items = blogs
            });
        }

        // GET: api/Blogs/{id}
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetBlogById(long id)
        {
            var blog = await _context.Blogs
                .Where(b => b.IdBlogs == id && (b.Status == "published" || b.Status == "active"))
                .Select(b => new
                {
                    b.IdBlogs,
                    b.Title,
                    b.Slug,
                    b.Thumbnail,
                    b.Excerpt,
                    b.Content,
                    b.PublishedAt,
                    AuthorName = _context.Users
                        .Where(u => u.IdUsers == b.IdUsers)
                        .Select(u => u.FullName)
                        .FirstOrDefault()
                })
                .FirstOrDefaultAsync();

            if (blog == null) return NotFound();

            return Ok(blog);
        }

        // GET: api/Blogs/by-slug/{slug}
        [HttpGet("by-slug/{slug}")]
        public async Task<IActionResult> GetBlogBySlug(string slug)
        {
            if (string.IsNullOrWhiteSpace(slug)) return BadRequest("slug is required");

            var blog = await _context.Blogs
                .Where(b => b.Slug == slug.Trim() && (b.Status == "published" || b.Status == "active"))
                .Select(b => new
                {
                    b.IdBlogs,
                    b.Title,
                    b.Slug,
                    b.Thumbnail,
                    b.Excerpt,
                    b.Content,
                    b.PublishedAt,
                    AuthorName = _context.Users
                        .Where(u => u.IdUsers == b.IdUsers)
                        .Select(u => u.FullName)
                        .FirstOrDefault()
                })
                .FirstOrDefaultAsync();

            if (blog == null) return NotFound();

            return Ok(blog);
        }

        // GET: api/Blogs/fashion-news
        [HttpGet("fashion-news")]
        public async Task<IActionResult> GetFashionNews([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                if (page <= 0) page = 1;
                if (pageSize <= 0 || pageSize > 50) pageSize = 10;

                var httpClient = new HttpClient();
                httpClient.Timeout = TimeSpan.FromSeconds(15);
                httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");

                // Sử dụng RSS2JSON service để convert RSS feed thành JSON
                // Hoặc có thể fetch trực tiếp từ RSS feed và parse XML
                // Ví dụ RSS feed từ các trang thời trang Việt Nam
                var rssFeeds = new[]
                {
                    "https://vnexpress.net/rss/thoi-trang.rss",
                    "https://www.elle.vn/rss",
                    "https://www.harpersbazaar.com/feed/"
                };

                var allArticles = new List<dynamic>();

                foreach (var rssUrl in rssFeeds)
                {
                    try
                    {
                        // Sử dụng RSS2JSON service (miễn phí, không cần API key)
                        var rss2JsonUrl = $"https://api.rss2json.com/v1/api.json?rss_url={Uri.EscapeDataString(rssUrl)}&api_key=public";
                        var response = await httpClient.GetStringAsync(rss2JsonUrl);
                        var rssData = JsonSerializer.Deserialize<JsonElement>(response);

                        if (rssData.TryGetProperty("items", out var items) && items.ValueKind == JsonValueKind.Array)
                        {
                            foreach (var item in items.EnumerateArray())
                            {
                                var title = item.TryGetProperty("title", out var titleProp) ? titleProp.GetString() : "";
                                var link = item.TryGetProperty("link", out var linkProp) ? linkProp.GetString() : "";
                                var description = item.TryGetProperty("description", out var descProp) ? descProp.GetString() : "";
                                var pubDate = item.TryGetProperty("pubDate", out var dateProp) ? dateProp.GetString() : "";
                                var thumbnail = item.TryGetProperty("thumbnail", out var thumbProp) ? thumbProp.GetString() : "";
                                
                                // Lấy thumbnail từ enclosure hoặc content nếu không có
                                if (string.IsNullOrEmpty(thumbnail))
                                {
                                    if (item.TryGetProperty("enclosure", out var enclosure) && enclosure.ValueKind == JsonValueKind.Object)
                                    {
                                        if (enclosure.TryGetProperty("link", out var encLink))
                                            thumbnail = encLink.GetString();
                                    }
                                }

                                // Chỉ lấy tin liên quan đến thời trang
                                if (!string.IsNullOrEmpty(title))
                                {
                                    var titleLower = title.ToLower();
                                    var descLower = (description ?? "").ToLower();
                                    
                                    // Từ khóa liên quan đến thời trang
                                    var fashionKeywords = new[]
                                    {
                                        "thời trang", "fashion", "style", "mốt", "trang phục", "quần áo",
                                        "áo", "quần", "váy", "giày", "túi xách", "phụ kiện", "thời trang nam",
                                        "thời trang nữ", "xu hướng", "trend", "outfit", "wardrobe", "clothing",
                                        "apparel", "designer", "brand", "thương hiệu", "bộ sưu tập", "collection",
                                        "runway", "catwalk", "model", "người mẫu", "show", "fashion week"
                                    };
                                    
                                    // Kiểm tra xem có từ khóa thời trang không
                                    var isFashionRelated = fashionKeywords.Any(keyword => 
                                        titleLower.Contains(keyword) || descLower.Contains(keyword));
                                    
                                    if (isFashionRelated)
                                    {
                                        allArticles.Add(new
                                        {
                                            IdBlogs = allArticles.Count + 1,
                                            Title = title,
                                            Slug = link?.Split('/').LastOrDefault()?.Split('?').FirstOrDefault() ?? $"article-{allArticles.Count + 1}",
                                            Link = link ?? "", // Link gốc từ RSS feed
                                            Thumbnail = thumbnail ?? "",
                                            Excerpt = description?.Length > 200 ? description.Substring(0, 200) + "..." : description ?? "",
                                            PublishedAt = pubDate,
                                            AuthorName = "Nguồn tin"
                                        });
                                    }
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        // Bỏ qua lỗi từ một RSS feed, tiếp tục với feed khác
                        Console.WriteLine($"Lỗi khi fetch RSS feed {rssUrl}: {ex.Message}");
                    }
                }

                // Nếu không lấy được từ RSS, fallback về database
                if (allArticles.Count == 0)
                {
                    var blogs = await _context.Blogs
                        .Where(b => b.Status == "published" || b.Status == "active")
                        .OrderByDescending(b => b.PublishedAt ?? DateTime.MinValue)
                        .ThenByDescending(b => b.IdBlogs)
                        .Skip((page - 1) * pageSize)
                        .Take(pageSize)
                        .Select(b => new
                        {
                            b.IdBlogs,
                            b.Title,
                            b.Slug,
                            b.Thumbnail,
                            b.Excerpt,
                            b.PublishedAt,
                            AuthorName = _context.Users
                                .Where(u => u.IdUsers == b.IdUsers)
                                .Select(u => u.FullName)
                                .FirstOrDefault() ?? "Admin"
                        })
                        .ToListAsync();

                    var totalItems = await _context.Blogs
                        .Where(b => b.Status == "published" || b.Status == "active")
                        .CountAsync();

                    return Ok(new
                    {
                        Page = page,
                        PageSize = pageSize,
                        TotalItems = totalItems,
                        TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
                        Items = blogs
                    });
                }

                // Phân trang cho articles từ RSS
                var totalItemsRss = allArticles.Count;
                var paginatedArticles = allArticles
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                return Ok(new
                {
                    Page = page,
                    PageSize = pageSize,
                    TotalItems = totalItemsRss,
                    TotalPages = (int)Math.Ceiling(totalItemsRss / (double)pageSize),
                    Items = paginatedArticles
                });
            }
            catch (Exception ex)
            {
                // Fallback về database nếu có lỗi
                try
                {
                    var blogs = await _context.Blogs
                        .Where(b => b.Status == "published" || b.Status == "active")
                        .OrderByDescending(b => b.PublishedAt ?? DateTime.MinValue)
                        .ThenByDescending(b => b.IdBlogs)
                        .Skip((page - 1) * pageSize)
                        .Take(pageSize)
                        .Select(b => new
                        {
                            b.IdBlogs,
                            b.Title,
                            b.Slug,
                            b.Thumbnail,
                            b.Excerpt,
                            b.PublishedAt,
                            AuthorName = _context.Users
                                .Where(u => u.IdUsers == b.IdUsers)
                                .Select(u => u.FullName)
                                .FirstOrDefault() ?? "Admin"
                        })
                        .ToListAsync();

                    var totalItems = await _context.Blogs
                        .Where(b => b.Status == "published" || b.Status == "active")
                        .CountAsync();

                    return Ok(new
                    {
                        Page = page,
                        PageSize = pageSize,
                        TotalItems = totalItems,
                        TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
                        Items = blogs
                    });
                }
                catch
                {
                    return StatusCode(500, new { message = "Lỗi khi lấy tin thời trang", error = ex.Message });
                }
            }
        }
    }
}

