using Backend_WebBanHang.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend_WebBanHang.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BlogsController : ControllerBase
    {
        private readonly IBlogService _blogService;
        public BlogsController(IBlogService blogService) { _blogService = blogService; }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var posts = await _blogService.GetAllBlogPostsAsync();
            return Ok(posts);
        }

        [HttpGet("{slug}")]
        public async Task<IActionResult> GetBySlug(string slug)
        {
            var post = await _blogService.GetBlogPostBySlugAsync(slug);
            return post != null ? Ok(post) : NotFound();
        }

        [HttpGet("about-us")]
        public async Task<IActionResult> GetAboutUs()
        {
            var about = await _blogService.GetAboutUsAsync();
            return about != null ? Ok(about) : NotFound();
        }
    }
}
