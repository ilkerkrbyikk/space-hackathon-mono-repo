namespace SpaceHackathon.Services
{
    public static class CosmicNoiseGenerator
    {
        private static readonly Random _rng = new();

        public record SensorProfile(double Min, double Max)
        {
            public double Center => (Min + Max) / 2.0;
            public double Range => Max - Min;
        }

        public static readonly Dictionary<string, SensorProfile> Profiles = new()
        {
            ["Temperature"] = new(20.0, 30.0),
            ["Voltage"] = new(12.0, 12.5),
            ["Radiation"] = new(0.0, 2.0),
        };

        public enum AnomalyType { None, Spike, Drop, Drift }

        public static double GenerateNominalValue(string sensorType)
        {
            if (!Profiles.TryGetValue(sensorType, out var p))
                return _rng.NextDouble() * 100;

            // Box-Muller yaklaşımı: range'in %40'ı kadar gaussian noise
            double u = 1 - _rng.NextDouble();
            double v = _rng.NextDouble();
            double gaussian = Math.Sqrt(-2.0 * Math.Log(u)) * Math.Cos(2 * Math.PI * v);
            double noise = gaussian * (p.Range * 0.2);

            return Math.Clamp(p.Center + noise, p.Min, p.Max);
        }

        public static (double value, AnomalyType anomaly) ApplyCosmicEffect(
            double nominal, string sensorType)
        {
            if (!Profiles.TryGetValue(sensorType, out var p))
                return (nominal, AnomalyType.None);

            double roll = _rng.NextDouble();

            // %7 Spike: ani yükseliş — radyasyon patlaması, ısı artışı
            if (roll < 0.07)
                return (p.Max + p.Range * (0.5 + _rng.NextDouble()), AnomalyType.Spike);

            // %5 Drop: ani düşüş — güç kesilmesi, sensör arızası
            if (roll < 0.12)
                return (p.Min - p.Range * (0.3 + _rng.NextDouble() * 0.4), AnomalyType.Drop);

            // %3 Drift: yavaş sapma — en sinsi anomali, ML'in asıl hedefi
            if (roll < 0.15)
                return (p.Max + p.Range * (0.1 + _rng.NextDouble() * 0.2), AnomalyType.Drift);

            // Normal: küçük radyatif gürültü
            double cosmicNoise = (_rng.NextDouble() - 0.5) * p.Range * 0.02;
            return (nominal + cosmicNoise, AnomalyType.None);
        }
    }
}