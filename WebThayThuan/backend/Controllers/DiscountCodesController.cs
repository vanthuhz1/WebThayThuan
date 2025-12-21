// Controllers/DiscountCodesController.cs
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Backend_WebBanHang.Data;
using Backend_WebBanHang.DTOs.DiscountCodes;
using Backend_WebBanHang.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend_WebBanHang.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DiscountCodesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DiscountCodesController(AppDbContext context)
        {
            _context = context;
        }

    }
}
