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
        private readonly AppDbContext _context; // Database context for accessing locations and routes
        private readonly IRouteService _routeService; // Service that runs the actual pathfinding algorithm

        public RouteController(AppDbContext context, IRouteService routeService)
        {
            _context = context;
            _routeService = routeService;
        }

        // POST api/route/optimize
        // Accepts a route optimization request and returns the calculated route
        [HttpPost("optimize")]
        public async Task<IActionResult> OptimizeRoute([FromBody] RouteOptimizationRequest request)
        {
            var nodes = await _context.Locations.ToListAsync(); // Fetch all location nodes from the database
            var edges = await _context.Routes.ToListAsync(); // Fetch all route segments (edges) from the database
            var result = _routeService.CalculateRoute(request, nodes, edges); // Run the route optimization algorithm
            return Ok(result); // Return the computed route as a 200 OK response
        }
    }
}
