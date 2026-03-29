using System.Net.Sockets;
using System.Threading.Channels;
using Grpc.Core;
using Grpc.Net.Client;
using Microsoft.AspNetCore.SignalR;
using SpaceHackathon.Grpc;
using SpaceHackathon.Hubs;
using SpaceHackathon.Records;

namespace SpaceHackathon.Clients
{
    public class TelemetryGrpcClient(string serverUrl, 
        ChannelReader<TelemetryPacket> reader,
        IHubContext<TelemetryHub> hubContext,
        ILogger<TelemetryGrpcClient> logger)
    {
        public async Task StartStreaming(CancellationToken ct)
        {
            using var channel = GrpcChannel.ForAddress(serverUrl);
            var client = new TelemetryProcessor.TelemetryProcessorClient(channel);
            using var stream = client.ProcessStream(cancellationToken: ct);

            // Python'dan gelen cevapları dinle ve SignalR'a bas
            var readTask = Task.Run(async () => {
                try
                {
                    await foreach (var response in stream.ResponseStream.ReadAllAsync(ct))
                    {
                        await hubContext.Clients.All.SendAsync("ReceiveTelemetry", new
                        {
                            timestamp = response.Timestamp,
                            value = response.CleanedValue,
                            isAnomaly = response.IsAnomaly,
                            confidence = response.Confidence
                        }, ct);
                    }
                }
                catch (Exception ex) { logger.LogError("Okuma hatası: " + ex.Message); }
            }, ct);

            // Simülatörden gelen paketleri Python'a gönder
            await foreach (var packet in reader.ReadAllAsync(ct))
            {
                await stream.RequestStream.WriteAsync(new TelemetryRequest
                {
                    Timestamp = packet.Timestamp,
                    SatelliteId= packet.SatelliteId,
                    RawValue = packet.RawValue,
                    SensorType = packet.SensorType,
                    Checksum = packet.Checksum 
                }, ct);
            }

            await stream.RequestStream.CompleteAsync();
            await readTask; // Okuma görevinin bittiğinden emin ol
        }
    }
}
