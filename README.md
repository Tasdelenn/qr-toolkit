# 🦀 QR Toolkit (Rust + WebAssembly + PWA)

> **Temel telefon özelliklerini fahiş aboneliklerle satanlara inat; %100 açık kaynak, reklamsız, gizlilik odaklı, sıfır maliyetli ve Rust ile güçlendirilmiş Hepsi-Bir-Arada QR Araç Kiti.**

🚀 **Canlı Uygulama:** [https://tasdelenn.github.io/qr-toolkit/](https://tasdelenn.github.io/qr-toolkit/)

[![Rust](https://img.shields.io/badge/Rust-1.80+-orange.svg?logo=rust)](https://www.rust-lang.org/)
[![WebAssembly](https://img.shields.io/badge/WebAssembly-Wasm-654FF0.svg?logo=webassembly)](https://webassembly.org/)
[![PWA](https://img.shields.io/badge/PWA-Ready-success.svg?logo=pwa)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![License: MIT OR Apache-2.0](https://img.shields.io/badge/License-MIT%2FApache--2.0-blue.svg)](LICENSE)

---

## 🌟 Neden Bu Proje? (Açık Kaynak Manifestosu)

Mobil uygulama mağazalarında (özellikle iOS App Store'da) en temel, bir telefonun doğasında olması gereken QR okuma ve oluşturma gibi araçlar haftalık 10-20 dolar gibi akıl almaz abonelik tuzaklarıyla, tam ekran reklamlarla ve gizlilik ihlalleriyle kullanıcılara dayatılmaktadır.

Bu proje bu sömürüye bir tepki olarak doğdu:
- **0 TL / 0 Dolar:** Sonsuza dek ücretsiz ve reklamsız.
- **Sıfır Veri Toplama:** Taranan veya oluşturulan hiçbir veri bir sunucuya gitmez; her şey cihazınızın RAM'inde, yerel olarak işlenir.
- **Apple Haracından Bağımsız:** Apple'ın 99$/yıl geliştirici ücretine veya 7 günde bir ölen geçici sertifikalara mahkûm olmadan, PWA standartlarıyla iOS cihazlara doğrudan yerel uygulama gibi kurulabilir.

---

## 🏗️ Mimari: Neden Rust ve Melez (Hybrid) Yapı?

Sistemlerin geleceğinin **Rust** olduğuna inanıyoruz. Bellek güvenliği, üstün optimizasyon ve C/C++ hızını modern dünyayla buluşturan Rust, bu projede WebAssembly (Wasm) olarak derlenerek tarayıcı katmanına entegre edilmiştir.

```
┌─────────────────────────────────────────────────────────────┐
│                       Kullanıcı Arayüzü                     │
│    (HTML5 + CSS3 + Responsive Mobile Shell + Tam Ekran)     │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
 ┌───────────────────────────┐  ┌───────────────────────────┐
 │   Donanım & Web API'leri  │  │  PWA & Çevrimdışı Bellek  │
 │ • WebRTC Kamera (Ön/Arka) │  │ • Service Worker (sw.js)  │
 │ • Tam Ekran (Fullscreen)  │  │ • manifest.json           │
 │ • Görsel Sürükle-Bırak    │  │ • Offline App Cache       │
 └─────────────┬─────────────┘  └───────────────────────────┘
               │ Piksel Verileri (RGBA Baytları) / Metin
               ▼
 ┌──────────────────────────────────────────────────────────┐
 │           🦀 Saf Rust WebAssembly Çekirdeği              │
 │                                                          │
 │  • decode_from_rgba: `rqrr` tabanlı yüksek hızlı çözümcü │
 │  • encode_to_svg:    `qrcode` vektörel SVG üretici       │
 │  • encode_to_matrix: Yüksek çözünürlüklü piksel matrisi  │
 └──────────────────────────────────────────────────────────┘
```

- **Ağır Matematik ve Piksel İşleme:** Tamamen Rust (`src/lib.rs`) tarafında koşar.
- **Donanım ve Arayüz:** WebRTC, Fullscreen API ve Service Worker ile modern web standartlarında melezlenmiştir.

---

## 🚀 Temel Özellikler

1. **Canlı Kamera ile QR Tarama (`zbar` dengi):**
   - Ön ve arka kamera arasında tek tıkla geçiş.
   - Gerçek zamanlı tarama vizörü ve lazer animasyonu.
   - QR kod yakalandığında titreşimli geri bildirim (Haptic Feedback).
   - Taranan bağlantıyı tek tıkla yeni sekmede açma veya panoya kopyalama.
2. **Görsel / Dosyadan QR Çözme (`zbarimg` dengi):**
   - Galeriden resim seçme veya masaüstünden sürükleyip bırakma (drag-and-drop).
   - Rust çekirdeğinde mikro saniyeler içinde anında çözümleme.
3. **Metinden QR Kod Oluşturma (`qrencode` dengi):**
   - Metin, link, Wi-Fi veya vCard verilerini anında QR koda dönüştürme.
   - Hata Düzeltme Seviyesi (ECL: Low, Medium, Quartile, High) seçimi.
   - **Vektörel SVG** olarak indirme (baskı kalitesi, sonsuz büyütülebilir).
   - **Yüksek Çözünürlüklü PNG** olarak indirme (1024x1024 kristal netlik).
4. **🖥️ Tam Ekran / Normal Mod Geçişi:**
   - Üst bardaki özel buton ile dikkat dağıtıcı tarayıcı öğelerini gizleyip tam odaklı tarama moduna geçiş.
5. **📴 %100 Çevrimdışı (Offline-first):**
   - Bir kez açtıktan sonra internet bağlantınız kesilse dahi (örneğin uçak modunda veya bodrum katta) eksiksiz çalışır.

---

## 📱 iPhone / iOS Kurulum Rehberi (Adım Adım)

iOS kullanıcıları için hiçbir karmaşık işlem veya bilgisayar bağlantısı gerekmez:

1. iPhone'unuzda **Safari** tarayıcısını açın ve uygulamanın adresine gidin.
2. Safari'nin alt ortasındaki **"Paylaş"** (kare içinden yukarı ok çıkan) simgesine dokunun.
3. Açılan menüde aşağı kaydırıp **"Ana Ekrana Ekle" (Add to Home Screen)** seçeneğini seçin.
4. Sağ üstteki **"Ekle"** butonuna basın.

🎉 **Tebrikler!** Artık telefonunuzun ana ekranında tıpkı App Store'dan yüklenmiş gibi çalışan, reklamsız, tam ekran ve internetsiz de açılan bir QR araç kitiniz var.

---

## 💻 Geliştiriciler İçin: Yerel Ortamda Çalıştırma ve Derleme

### Gereksinimler
- [Rust & Cargo](https://rustup.rs/) (1.80 veya üzeri)
- `wasm32-unknown-unknown` hedefi
- `wasm-bindgen-cli`

```bash
# 1. wasm32 hedefini ekleyin
rustup target add wasm32-unknown-unknown

# 2. wasm-bindgen-cli aracını kurun
cargo install wasm-bindgen-cli --version 0.2.100
```

### Projeyi Derleme
```bash
# Depoyu klonlayın
git clone https://github.com/kullanici-adiniz/qr-toolkit.git
cd qr-toolkit

# Rust kodunu WebAssembly'e derleyin
./build.sh
```

### Yerel Test Sunucusunu Başlatma
Modern tarayıcılar güvenlik nedeniyle WebAssembly ve kamera erişimini `file://` protokolünde kısıtlar. Yerel bir HTTP sunucusu çalıştırmak yeterlidir:

```bash
cd www
python3 -m http.server 8080
```
Tarayıcınızda `http://localhost:8080` adresini açarak test edebilirsiniz.

---

## 🌐 GitHub Pages ile Ücretsiz Yayına Alma

Bu projeyi dünyadaki tüm kullanıcıların erişimine açmak 1 dakika sürer:

1. Bu depoyu GitHub'da kendi hesabınıza yükleyin (`git push origin main`).
2. Deponuzun **Settings -> Pages** sekmesine gidin.
3. **Build and deployment** altında **Source** olarak `Deploy from a branch` seçin.
4. **Branch** olarak `main` ve klasör olarak `/www` seçip **Save** butonuna tıklayın.

Birkaç dakika sonra uygulamanız `https://kullanici-adiniz.github.io/depo-adi/` adresinde canlıya çıkacaktır!

---

## 🧪 Birim Testleri

Rust çekirdeğindeki encode ve decode algoritmalarının matematiksel doğruluğunu test etmek için:

```bash
cargo test
```

---

## 📄 Lisans

Bu proje özgür yazılım topluluğunu desteklemek amacıyla **MIT** veya **Apache-2.0** çift lisansı ile lisanslanmıştır. Dilediğiniz gibi çatallayabilir (fork), geliştirebilir ve özgürce paylaşabilirsiniz.
