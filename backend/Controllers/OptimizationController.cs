using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartLogistics.IDSS.Data;
using SmartLogistics.IDSS.Models;
using SmartLogistics.IDSS.Services;

namespace SmartLogistics.IDSS.Controllers
{
    // =========================================================================
    // ISSUE 5: Tour & Schedule Optimization Controller
    // =========================================================================
    [ApiController]
    [Route("api/[controller]")]
    public class OptimizationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IOptimizationService _optimizationService;

        public OptimizationController(AppDbContext context, IOptimizationService optimizationService)
        {
            _context = context;
            _optimizationService = optimizationService;
        }

        [HttpPost("tsp")]
        public async Task<IActionResult> OptimizeTour([FromQuery] string algorithm = "simulated_annealing", [FromQuery] int iterations = 1000)
        {
            var waypoints = await _context.Locations.Take(12).ToListAsync();
            var result = _optimizationService.OptimizeDeliveryTour(waypoints, algorithm, iterations);
            return Ok(result);
        }
    }
}
