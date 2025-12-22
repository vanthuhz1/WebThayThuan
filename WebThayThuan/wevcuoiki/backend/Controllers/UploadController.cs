using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_WebBanHang.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public UploadController(IWebHostEnvironment env)
        {
            _env = env;
        }

        /// <summary>
        /// Upload một hoặc nhiều ảnh
        /// </summary>
        [HttpPost("images")]
        [Authorize]
        public async Task<IActionResult> UploadImages([FromForm] List<IFormFile> files)
        {
            if (files == null || files.Count == 0)
            {
                return BadRequest(new { message = "Không có file nào được chọn" });
            }

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var maxFileSize = 5 * 1024 * 1024; // 5MB

            var uploadedUrls = new List<string>();

            // Tạo thư mục uploads nếu chưa có
            var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            foreach (var file in files)
            {
                // Kiểm tra extension
                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(extension))
                {
                    return BadRequest(new { message = $"File {file.FileName} không được hỗ trợ. Chỉ chấp nhận: {string.Join(", ", allowedExtensions)}" });
                }

                // Kiểm tra kích thước
                if (file.Length > maxFileSize)
                {
                    return BadRequest(new { message = $"File {file.FileName} quá lớn. Tối đa 5MB" });
                }

                // Tạo tên file unique
                var uniqueFileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                // Lưu file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Tạo URL để trả về
                var fileUrl = $"{Request.Scheme}://{Request.Host}/uploads/{uniqueFileName}";
                uploadedUrls.Add(fileUrl);
            }

            return Ok(new { urls = uploadedUrls, message = $"Đã upload {uploadedUrls.Count} ảnh thành công" });
        }
    }
}
