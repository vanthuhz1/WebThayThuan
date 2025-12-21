using Backend_WebBanHang.DTOs.Blogs;
using Backend_WebBanHang.Models;
using Backend_WebBanHang.Data;
using Backend_WebBanHang.DTOs.Reviews;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
namespace Backend_WebBanHang.Services
{
    public class BlogService : IBlogService
    {
        private readonly AppDbContext _context;
        public BlogService(AppDbContext context) { _context = context; }

        public async Task<List<BlogPostDto>> GetAllBlogPostsAsync()
        {
            return await _context.BlogPosts.Where(b => !b.IsAboutUs).Select(b => new BlogPostDto { /* map */ }).ToListAsync();
        }

        public async Task<BlogPostDto> GetBlogPostBySlugAsync(string slug)
        {
            var post = await _context.BlogPosts.FirstOrDefaultAsync(b => b.Slug == slug);
            return post != null ? new BlogPostDto { /* map */ } : null;
        }

        public async Task<BlogPostDto> GetAboutUsAsync()
        {
            var about = await _context.BlogPosts.FirstOrDefaultAsync(b => b.IsAboutUs);
            return about != null ? new BlogPostDto { /* map */ } : null;
        }
    }
}
