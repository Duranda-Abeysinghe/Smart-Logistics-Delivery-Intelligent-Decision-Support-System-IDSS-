using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartLogistics.IDSS.Data;
using SmartLogistics.IDSS.Models;
using SmartLogistics.IDSS.Services;

namespace SmartLogistics.IDSS.Controllers
{
    //  Network Topology & Centrality Controller

    [ApiController]
    [Route("api/[controller]")]
    public class NetworkController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly INetworkService _networkService;

        public NetworkController(AppDbContext context, INetworkService networkService)
        {
            _context = context;
            _networkService = networkService;
        }

        [HttpGet("analyze")]
        public async Task<IActionResult> AnalyzeNetwork()
        {
            var nodes = await _context.Locations.ToListAsync();
            var edges = await _context.Routes.ToListAsync();

            var result = _networkService.AnalyzeNetworkTopology(nodes, edges);
            return Ok(result);
        }
    }
}