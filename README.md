# Space Hackathon - Uydu Telemetri Sistemi

## 📡 Proje Açıklaması

Space Hackathon, uydu telemetri verilerini gerçek zamanlı olarak işleyen, izleyen ve anomali tespiti yapan bir monorepo projesidir. Sistem, üç ana bileşenden oluşmaktadır:

- **API**: Telemetri verilerini yönetmek için gRPC tabanlı backend
- **Pipeline**: Machine Learning ile anomali tespiti yapan veri işleme sistemi
- **UI**: 3D görselleştirme ve gerçek zamanlı izleme için React uygulaması

---

## 🏗️ Proje Mimarisi

### 1. **SpaceHackathon.API** (.NET 8.0)
Backend API servisi, gRPC protokolü kullanarak telemetri verilerini işler.

**Teknolojiler:**
- .NET 8.0 Web API
- gRPC (Google Remote Procedure Call)
- Protocol Buffers (protobuf)
- SignalR (gerçek zamanlı iletişim)
- Swagger/Swashbuckle (API dokumentasyonu)

**Ana Bileşenler:**
- `TelemetryController`: RESTful endpoints
- `TelemetryHub`: WebSocket tabanlı gerçek zamanlı veri aktarımı
- `TelemetryGrpcClient`: gRPC istemcisi

### 2. **SpaceHackathon.Pipeline** (Python)
Machine Learning tabanlı anomali tespiti ve veri işleme sistemi.

**Teknolojiler:**
- Python 3.x
- gRPC Server
- scikit-learn (Isolation Forest algoritması)
- NumPy (sayısal işlemler)
- Protocol Buffers

**Özellikleri:**
- Sıcaklık, gerilim ve radyasyon sensörlerinden veri işleme
- Anomali tipi sınıflandırması (Threshold, Model-based, Drift)
- Veri drift tespiti
- Gerçek zamanlı model eğitimi ve yeniden eğitilmesi

### 3. **SpaceHackathon.UI** (Next.js + React)
Uydu telemetri verilerinin 3D görselleştirilmesi ve izlenmeci için kullanıcı arayüzü.

**Teknolojiler:**
- Next.js 16.2
- React 19
- TypeScript
- Tailwind CSS
- Three.js (3D grafikleri)
- React Three Fiber (3D bileşenler)
- Microsoft SignalR (gerçek zamanlı iletişim)

**Özellikler:**
- 3D uydu görselleştirilmesi
- Gerçek zamanlı telemetri verileri
- Anomali göstergeleri
- Grafik ve tablosal veriler

---

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- .NET 8.0 SDK
- Python 3.8+
- Node.js 18+
- npm veya yarn

### API Sunucusunu Başlatma

```bash
cd SpaceHackathon.API/SpaceHackathon
dotnet run
```

API `https://localhost:7139` adresinde çalışacaktır.

### Pipeline Sunucusunu Başlatma

```bash
cd SpaceHackathon.Pipeline
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

Pipeline sunucusu gRPC üzerinden dinleme yapmaya başlayacaktır.

### UI Uygulamasını Başlatma

```bash
cd SpaceHackathon.Ui/space-hackathon
npm install
npm run dev
```

UI uygulaması `http://localhost:3000` adresinde açılacaktır.

---

## 📊 Veri Akışı

1. **Sensörler** → Telemetri verileri üretir
2. **Pipeline** → gRPC üzerinden veri alır, anomali tespiti yapır
3. **API** → Pipeline'dan gelen verileri işler, SignalR ile broadcasting yapar
4. **UI** → SignalR üzerinden verileri alır, 3D olarak görselleştirir

---

## 🔍 Anomali Tespiti Türleri

Pipeline üç tür anomali tespiti uygular:

1. **Threshold Tabanlı**: Normal aralığın dışında olan değerler
2. **Model Tabanlı**: Isolation Forest ML modeli ile tespit
3. **Drift Tespiti**: Veri dağılımında meydana gelen değişimlerin tespit edilmesi

---

## 📝 Sensör Parametreleri

### Beklenen Değer Aralıkları:
- **Sıcaklık (Temperature)**: 20.0 - 30.0 °C
- **Gerilim (Voltage)**: 12.0 - 12.5 V
- **Radyasyon (Radiation)**: 0.0 - 2.0 mSv

---

## 🛠️ Geliştirme

### Proje Yapısı

```
space-hackathon/
├── SpaceHackathon.API/         # .NET Backend API
│   └── SpaceHackathon/
│       ├── Controllers/
│       ├── Hubs/
│       ├── Clients/
│       └── Protos/
├── SpaceHackathon.Pipeline/    # Python ML Pipeline
│   ├── server.py
│   └── telemetry_pb2*
├── SpaceHackathon.Ui/          # Next.js React UI
│   └── space-hackathon/
│       ├── app/
│       ├── components/
│       └── package.json
└── README.md
```

---

## 📄 Lisans

Bu proje Space Hackathon etkinliği altında geliştirilmiştir.

---

## 📞 İletişim

Proje hakkında sorularınız için GitHub Issues kısmında ticket açabilirsiniz.
