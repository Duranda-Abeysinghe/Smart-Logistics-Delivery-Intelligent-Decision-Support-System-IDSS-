using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartLogistics.IDSS.Data;
using SmartLogistics.IDSS.Models;
using SmartLogistics.IDSS.Services;

namespace SmartLogistics.IDSS.Controllers
{
    // ISSUE 4: Intelligent Decision Support Controller
    [ApiController]
    [Route("api/[controller]")]
    public class DecisionController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IDecisionService _decisionService;

        public DecisionController(AppDbContext context, IDecisionService decisionService)
        {
            _context = context;
            _decisionService = decisionService;
        }

        [HttpPost("prioritize")]
        public async Task<IActionResult> PrioritizeOrders([FromBody] DecisionWeights? weights)
        {
            var orders = await _context.Orders.ToListAsync();
            var result = _decisionService.EvaluateOrderPriorities(orders, weights ?? new DecisionWeights());
            return Ok(result);
        }
    }
}
