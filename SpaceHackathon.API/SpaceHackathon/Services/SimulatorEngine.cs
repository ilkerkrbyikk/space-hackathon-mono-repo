using System.Threading.Channels;
using SpaceHackathon.Records;

namespace SpaceHackathon.Services
{
    public class SimulatorEngine(
        ChannelWriter<TelemetryPacket> writer,
        ILogger<SimulatorEngine> logger)
    {
        // Her uydu ağırlıklı olarak bir sensör tipi gönderiyor
        private static readonly (string Id, string PrimarySensor, int DelayMs)[] Satellites =
        [
            ("SAT-TUA-01", "Temperature", 800),
            ("SAT-TUA-02", "Voltage",     1200),
            ("SAT-TUA-03", "Radiation",   1250),
        ];

        private static readonly string[] AllSensors =
            ["Temperature", "Voltage", "Radiation"];

        private static readonly Random _rng = new();

        public async Task StartSimulation(CancellationToken ct)
        {
            logger.LogInformation("Simülasyon başladı. Aktif uydular: {Sats}",
                string.Join(", ", Satellites.Select(s => s.Id)));

            // 3 uydu eşzamanlı veri gönderiyor
            var tasks = Satellites
                .Select(s => SimulateSatellite(s.Id, s.PrimarySensor, s.DelayMs, ct))
                .ToArray();

            await Task.WhenAll(tasks);
        }

        private async Task SimulateSatellite(
            string satelliteId, string primarySensor, int delayMs, CancellationToken ct)
        {
            while (!ct.IsCancellationRequested)
            {
                // %70 primary sensör, %30 diğer sensörler
                string sensor = _rng.NextDouble() < 0.7
                    ? primarySensor
                    : AllSensors[_rng.Next(AllSensors.Length)];

                double nominal = CosmicNoiseGenerator.GenerateNominalValue(sensor);
                var (rawValue, anomalyType) = CosmicNoiseGenerator.ApplyCosmicEffect(nominal, sensor);

                var packet = new TelemetryPacket(
                    Timestamp: DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    SatelliteId: satelliteId,
                    SensorType: sensor,
                    RawValue: rawValue,
                    Checksum: Guid.NewGuid().ToString()[..8],
                    IsCorrupted: anomalyType != CosmicNoiseGenerator.AnomalyType.None
                );

                await writer.WriteAsync(packet, ct);

                logger.LogDebug("[{Sat}] {Sensor}: {Value:F4} ({Anomaly})",
                    satelliteId, sensor, rawValue, anomalyType);

                await Task.Delay(delayMs, ct);
            }
        }
    }
}