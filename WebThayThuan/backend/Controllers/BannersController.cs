using Backend_WebBanHang.Data;
using Backend_WebBanHang.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend_WebBanHang.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class BannersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BannersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Banners/public
        [HttpGet("public")]
        public async Task<IActionResult> GetPublicBanners()
        {
            var items = await _context.Banners
                .OrderByDescending(b => b.IdBanners)
                .Select(b => new
                {
                    b.IdBanners,
                    b.ImageUrl,
                    b.LinkUrl
                })
                .ToListAsync();

            return Ok(items);
        }
    }
}

