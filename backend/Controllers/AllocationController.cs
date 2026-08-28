using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartLogistics.IDSS.Data;
using SmartLogistics.IDSS.Models;
using SmartLogistics.IDSS.Services;

namespace SmartLogistics.IDSS.Controllers
{
    // =========================================================================
    // ISSUE 2: Resource Allocation Controller
    // =========================================================================
    [ApiController]
    [Route("api/[controller]")]
    public class AllocationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAllocationService _allocationService;

        public AllocationController(AppDbContext context, IAllocationService allocationService)
        {
            _context = context;
            _allocationService = allocationService;
        }

        [HttpPost("allocate")]
        public async Task<IActionResult> AllocateResources([FromQuery] string strategy = "knapsack")
        {
            var orders = await _context.Orders.ToListAsync();
            var vehicles = await _context.Vehicles.ToListAsync();
            var drivers = await _context.Drivers.ToListAsync();

            var result = _allocationService.AllocateFleetResources(orders, vehicles, drivers, strategy);
            return Ok(result);
        }
    }
}
