using System.Collections.Concurrent;
using System.Threading.Channels;
using Grpc.Core;
using Grpc.Net.Client;
using Microsoft.AspNetCore.SignalR;
using SpaceHackathon.Grpc;
using SpaceHackathon.Hubs;
using SpaceHackathon.Records;

namespace SpaceHackathon.Services
{
    public class TelemetryWorker(
        IHubContext<TelemetryHub> hubContext,
        ILogger<TelemetryWorker> logger,
        ILoggerFactory loggerFactory) : BackgroundService
    {
        private const string GrpcServerUrl = "http://localhost:50051";

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            logger.LogInformation("TelemetryWorker başladı: {Time}", DateTimeOffset.Now);

            var dataChannel = Channel.CreateBounded<TelemetryPacket>(
                new BoundedChannelOptions(500)
                {
                    FullMode = BoundedChannelFullMode.DropOldest
                });

            var simLogger = loggerFactory.CreateLogger<SimulatorEngine>();
            var simulator = new SimulatorEngine(dataChannel.Writer, simLogger);
            var simTask = simulator.StartSimulation(stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    logger.LogInformation("Python gRPC sunucusuna bağlanılıyor...");

                    using var grpcChannel = GrpcChannel.ForAddress(GrpcServerUrl);
                    var client = new TelemetryProcessor.TelemetryProcessorClient(grpcChannel);
                    using var stream = client.ProcessStream(cancellationToken: stoppingToken);

                    // Response ile eşleştirmek için timestamp → orijinal paket
                    var inFlight = new ConcurrentDictionary<long, TelemetryPacket>();

                    var sendTask = Task.Run(async () =>
                    {
                        try
                        {
                            await foreach (var packet in dataChannel.Reader.ReadAllAsync(stoppingToken))
                            {
                                inFlight[packet.Timestamp] = packet;

                                await stream.RequestStream.WriteAsync(new TelemetryRequest
                                {
                                    Timestamp = packet.Timestamp,
                                    SatelliteId = packet.SatelliteId,
                                    SensorType = packet.SensorType,
                                    RawValue = packet.RawValue,
                                    Checksum = packet.Checksum
                                }, stoppingToken);
                            }
                        }
                        finally
                        {
                            await stream.RequestStream.CompleteAsync();
                        }
                    }, stoppingToken);

                    await foreach (var response in stream.ResponseStream.ReadAllAsync(stoppingToken))
                    {
                        inFlight.TryRemove(response.Timestamp, out var original);

                        await hubContext.Clients.All.SendAsync("ReceiveTelemetry", new
                        {
                            timestamp = response.Timestamp,
                            value = response.CleanedValue,
                            rawValue = original?.RawValue ?? response.CleanedValue,
                            isAnomaly = response.IsAnomaly,
                            confidence = response.Confidence,
                            satelliteId = original?.SatelliteId ?? "UNKNOWN",
                            sensorType = original?.SensorType ?? "UNKNOWN",
                            anomalyType = response.AnomalyType.ToString(),  // "NONE" | "SPIKE" | "DROP" | "DRIFT"
                            message = response.Message
                        }, stoppingToken);

                        logger.LogInformation(
                            "[{Sat}] {Sensor}: {Raw:F4} → {Cleaned:F4} | Anomali={IsAnomaly}",
                            original?.SatelliteId, original?.SensorType,
                            original?.RawValue, response.CleanedValue, response.IsAnomaly);
                    }

                    await sendTask;
                }
                catch (OperationCanceledException) { break; }
                catch (RpcException ex) when (ex.StatusCode == StatusCode.Unavailable)
                {
                    logger.LogWarning("Python sunucusuna bağlanılamadı. 5sn sonra tekrar...");
                    await Task.Delay(5000, stoppingToken);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Beklenmeyen hata.");
                    await Task.Delay(2000, stoppingToken);
                }
            }

            await simTask;
        }
    }
}