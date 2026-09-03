using Microsoft.AspNetCore.Mvc;
using SmartLogistics.IDSS.Services;

namespace SmartLogistics.IDSS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BenchmarkController : ControllerBase
    {
        private readonly IBenchmarkService _benchmarkService;

        public BenchmarkController(IBenchmarkService benchmarkService)
        {
            _benchmarkService = benchmarkService;
        }

        [HttpGet("run")]
        public IActionResult RunBenchmark([FromQuery] string module = "route", [FromQuery] int scale = 12)
        {
            var response = _benchmarkService.ExecuteMultiScaleBenchmark(module, scale);
            return Ok(response);
        }
    }
}
