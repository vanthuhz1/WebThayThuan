namespace Backend_WebBanHang.DTOs.Admin
{
    public class DashboardStatsDto
    {
        // Tổng quan
        public long TotalProducts { get; set; }
        public long TotalOrders { get; set; }
        public long TotalUsers { get; set; }
        public decimal TotalRevenue { get; set; }
        
        // Đơn hàng theo trạng thái
        public long PendingOrders { get; set; }
        public long ProcessingOrders { get; set; }
        public long CompletedOrders { get; set; }
        public long CancelledOrders { get; set; }
        
        // Doanh thu theo tháng (12 tháng gần nhất)
        public List<MonthlyRevenueDto> MonthlyRevenue { get; set; } = new List<MonthlyRevenueDto>();
        
        // Đơn hàng theo tháng
        public List<MonthlyOrderDto> MonthlyOrders { get; set; } = new List<MonthlyOrderDto>();
        
        // Top sản phẩm bán chạy
        public List<TopProductDto> TopProducts { get; set; } = new List<TopProductDto>();
        
        // Đơn hàng gần đây
        public List<RecentOrderDto> RecentOrders { get; set; } = new List<RecentOrderDto>();
    }
    
    public class MonthlyRevenueDto
    {
        public string Month { get; set; } = "";
        public decimal Revenue { get; set; }
    }
    
    public class MonthlyOrderDto
    {
        public string Month { get; set; } = "";
        public long Count { get; set; }
    }
    
    public class TopProductDto
    {
        public long IdProducts { get; set; }
        public string Name { get; set; } = "";
        public long SoldQuantity { get; set; }
        public decimal Revenue { get; set; }
    }
    
    public class RecentOrderDto
    {
        public long IdOrders { get; set; }
        public string OrderNumber { get; set; } = "";
        public string CustomerName { get; set; } = "";
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = "";
        public DateTime? CreatedAt { get; set; }
    }
}

