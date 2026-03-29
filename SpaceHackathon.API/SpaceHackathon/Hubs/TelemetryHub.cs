using Microsoft.AspNetCore.SignalR;

namespace SpaceHackathon.Hubs
{
    public class TelemetryHub : Hub
    {
        private readonly ILogger<TelemetryHub> logger;

        public TelemetryHub(ILogger<TelemetryHub> logger)
        {
            this.logger = logger;
        }

        public override Task OnConnectedAsync()
        {
            logger.LogInformation("Yeni bir bağlantı oluştu.");
            return base.OnConnectedAsync();
        }
    }
}
