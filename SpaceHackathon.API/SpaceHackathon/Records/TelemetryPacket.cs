namespace SpaceHackathon.Records
{
    public record TelemetryPacket(
     long Timestamp,
     string SatelliteId,
     string SensorType,
     double RawValue,
     string Checksum,
     bool IsCorrupted = false 
    );
}
