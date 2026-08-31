using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartLogistics.IDSS.Data;
using SmartLogistics.IDSS.Models;
using SmartLogistics.IDSS.Services;

namespace SmartLogistics.IDSS.Controllers
{
    // =========================================================================
    // ISSUE 1: Route Optimization Controller
    // =========================================================================
    [ApiController]
    [Route("api/[controller]")]
    public class RouteController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IRouteService _routeService;

        public RouteController(AppDbContext context, IRouteService routeService)
        {
            _context = context;
            _routeService = routeService;
        }

        [HttpPost("optimize")]
        public async Task<IActionResult> OptimizeRoute([FromBody] RouteOptimizationRequest request)
        {
            var nodes = await _context.Locations.ToListAsync();
            var edges = await _context.Routes.ToListAsync();

            var result = _routeService.CalculateRoute(request, nodes, edges);
            return Ok(result);
        }
    }
}
