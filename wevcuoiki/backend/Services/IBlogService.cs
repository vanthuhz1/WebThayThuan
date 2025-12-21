using Backend_WebBanHang.DTOs.Blogs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Backend_WebBanHang.Services
{
    public interface IBlogService
    {
        Task<List<BlogPostDto>> GetAllBlogPostsAsync();
        Task<BlogPostDto> GetBlogPostBySlugAsync(string slug);
        Task<BlogPostDto> GetAboutUsAsync();
    }
}
