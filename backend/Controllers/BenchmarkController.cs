using Microsoft.AspNetCore.Mvc;
using SmartLogistics.IDSS.Services;

namespace SmartLogistics.IDSS.Controllers
{
    // Handles API requests related to algorithm benchmarking
    [ApiController]
    [Route("api/[controller]")]
    public class BenchmarkController : ControllerBase
    {
        // Service used to execute benchmark calculations
        private readonly IBenchmarkService _benchmarkService;

        // Injects the benchmark service through dependency injection
        public BenchmarkController(IBenchmarkService benchmarkService)
        {
            _benchmarkService = benchmarkService;
        }

        // Runs the benchmark for the selected module and scale
        [HttpGet("run")]
        public IActionResult RunBenchmark(
            [FromQuery] string module = "route",
            [FromQuery] int scale = 12)
        {
            // Execute the benchmark using the provided parameters
            var response = _benchmarkService.ExecuteMultiScaleBenchmark(module, scale);

            // Return the benchmark results as an HTTP 200 response
            return Ok(response);
        }
    }
}
