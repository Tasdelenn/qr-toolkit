import initWasm, { encode_to_svg, encode_to_matrix, decode_from_rgba } from '../pkg/qr_toolkit.js';

// Application State
const state = {
  wasmReady: false,
  stream: null,
  isScanning: false,
  facingMode: 'environment', // 'environment' (back) or 'user' (front)
  animFrameId: null,
  activeTab: 'scan'
};

// DOM Elements
const elements = {
  // Tabs
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  
  // Fullscreen
  btnFullscreen: document.getElementById('btn-fullscreen'),
  fsIcon: document.getElementById('fs-icon'),
  fsText: document.getElementById('fs-text'),

  // Scanner
  video: document.getElementById('scanner-video'),
  btnFlipCamera: document.getElementById('btn-flip-camera'),
  btnToggleScan: document.getElementById('btn-toggle-scan'),
  scannerStatus: document.getElementById('scanner-status'),
  scannerResultCard: document.getElementById('scanner-result-card'),
  scannerResultText: document.getElementById('scanner-result-text'),
  btnScannerCopy: document.getElementById('btn-scanner-copy'),
  btnScannerOpen: document.getElementById('btn-scanner-open'),
  btnScannerShare: document.getElementById('btn-scanner-share'),
  btnScannerRescan: document.getElementById('btn-scanner-rescan'),

  // File Decoder
  dropzone: document.getElementById('dropzone'),
  fileInput: document.getElementById('file-input'),
  filePreviewContainer: document.getElementById('file-preview-container'),
  filePreviewImg: document.getElementById('file-preview-img'),
  fileResultCard: document.getElementById('file-result-card'),
  fileResultText: document.getElementById('file-result-text'),
  btnFileCopy: document.getElementById('btn-file-copy'),
  btnFileOpen: document.getElementById('btn-file-open'),
  btnFileShare: document.getElementById('btn-file-share'),

  // Generator
  genInput: document.getElementById('gen-input'),
  genEcl: document.getElementById('gen-ecl'),
  qrSvgHolder: document.getElementById('qr-svg-holder'),
  btnDownloadSvg: document.getElementById('btn-download-svg'),
  btnDownloadPng: document.getElementById('btn-download-png'),
  btnShareQr: document.getElementById('btn-share-qr'),

  // Toast
  toast: document.getElementById('toast'),
  toastMsg: document.getElementById('toast-msg')
};

// Offscreen Canvas for sampling frames
const sampleCanvas = document.createElement('canvas');
const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });

// Show Toast Message
function showToast(message, duration = 2800) {
  elements.toastMsg.textContent = message;
  elements.toast.classList.add('show');
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, duration);
}

// Copy to Clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Kopyalandı! 📋');
  } catch (err) {
    showToast('Kopyalama başarısız oldu');
  }
}

// Share API helper
async function shareContent(title, text, url = '') {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url: url || undefined });
      showToast('Paylaşıldı! 🚀');
    } catch (e) {
      if (e.name !== 'AbortError') showToast('Paylaşım iptal edildi veya başarısız');
    }
  } else {
    copyToClipboard(text);
    showToast('Paylaşım API desteklenmiyor, metin kopyalandı.');
  }
}

// Check if string is URL
function isUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Initialize WebAssembly
async function initializeWasm() {
  try {
    await initWasm();
    state.wasmReady = true;
    console.log('[Rust Wasm] QR Toolkit Engine initialized successfully.');
    // Initial QR generation
    updateQrGeneration();
  } catch (err) {
    console.error('[Rust Wasm] Failed to initialize Wasm module:', err);
    showToast('Rust Wasm motoru yüklenemedi!');
  }
}

// Register PWA Service Worker
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => console.log('[PWA] Service Worker registered:', reg.scope))
        .catch((err) => console.warn('[PWA] Service Worker registration failed:', err));
    });
  }
}

// Fullscreen Management
function initFullscreenToggle() {
  const isFullscreen = () => !!(document.fullscreenElement || document.webkitFullscreenElement);

  function updateFullscreenUI() {
    if (isFullscreen()) {
      elements.fsText.textContent = 'Normal';
      elements.fsIcon.innerHTML = `<path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-14v3h3v2h-5V5h2z"/>`;
    } else {
      elements.fsText.textContent = 'Tam Ekran';
      elements.fsIcon.innerHTML = `<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>`;
    }
  }

  elements.btnFullscreen.addEventListener('click', async () => {
    try {
      if (!isFullscreen()) {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        } else {
          showToast("İpucu: iPhone'da tam ekran için Safari'de 'Ana Ekrana Ekle' deyin.");
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
      }
    } catch (e) {
      console.warn('Fullscreen request failed:', e);
      showToast("İpucu: iPhone'da tam ekran için Safari'de 'Ana Ekrana Ekle' deyin.");
    }
    updateFullscreenUI();
  });

  document.addEventListener('fullscreenchange', updateFullscreenUI);
  document.addEventListener('webkitfullscreenchange', updateFullscreenUI);
}

// Tab Switching
function initTabs() {
  elements.tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabTarget = btn.getAttribute('data-tab');
      if (tabTarget === state.activeTab) return;

      // Update buttons
      elements.tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update contents
      elements.tabContents.forEach(c => c.classList.remove('active'));
      document.getElementById(`tab-${tabTarget}`).classList.add('active');

      state.activeTab = tabTarget;

      // Handle camera start/stop
      if (tabTarget === 'scan') {
        startScanner();
      } else {
        stopScanner();
      }
    });
  });
}

// ================= Camera Scanner ================= //

async function startScanner() {
  if (state.isScanning) return;
  elements.scannerResultCard.style.display = 'none';
  elements.scannerStatus.textContent = 'Kamera başlatılıyor...';

  try {
    const constraints = {
      video: {
        facingMode: { ideal: state.facingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    state.stream = await navigator.mediaDevices.getUserMedia(constraints);
    elements.video.srcObject = state.stream;
    await elements.video.play();
    state.isScanning = true;
    elements.scannerStatus.textContent = 'QR kodu karenin içine hizalayın';
    requestScanFrame();
  } catch (err) {
    console.error('Camera access error:', err);
    elements.scannerStatus.textContent = 'Kamera erişimi reddedildi veya bulunamadı.';
    showToast('Kamera açılamadı. İzinleri kontrol edin.');
  }
}

function stopScanner() {
  state.isScanning = false;
  if (state.animFrameId) {
    cancelAnimationFrame(state.animFrameId);
    state.animFrameId = null;
  }
  if (state.stream) {
    state.stream.getTracks().forEach(track => track.stop());
    state.stream = null;
  }
  elements.video.srcObject = null;
}

function requestScanFrame() {
  if (!state.isScanning) return;
  state.animFrameId = requestAnimationFrame(scanVideoFrame);
}

function scanVideoFrame() {
  if (!state.isScanning || !state.wasmReady) {
    requestScanFrame();
    return;
  }

  const video = elements.video;
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    const vw = video.videoWidth;
    const vh = video.videoHeight;

    if (vw > 0 && vh > 0) {
      // Downsample large video frames for max performance (ideal ~480 to 640px)
      const maxDim = 512;
      const scale = Math.min(1, maxDim / Math.max(vw, vh));
      const targetW = Math.round(vw * scale);
      const targetH = Math.round(vh * scale);

      sampleCanvas.width = targetW;
      sampleCanvas.height = targetH;
      sampleCtx.drawImage(video, 0, 0, targetW, targetH);

      const imageData = sampleCtx.getImageData(0, 0, targetW, targetH);
      try {
        const decodedText = decode_from_rgba(targetW, targetH, imageData.data);
        if (decodedText) {
          onQrCodeDetected(decodedText);
          return; // Stop scanning loop on success
        }
      } catch (e) {
        // No QR detected in this frame, continue
      }
    }
  }

  requestScanFrame();
}

function onQrCodeDetected(text) {
  // Haptic feedback
  if (navigator.vibrate) navigator.vibrate([40, 60, 40]);

  state.isScanning = false;
  if (state.animFrameId) cancelAnimationFrame(state.animFrameId);

  elements.scannerResultText.textContent = text;
  elements.scannerResultCard.style.display = 'flex';
  elements.scannerStatus.textContent = 'QR Kod başarıyla çözüldü! 🎉';

  // URL action
  if (isUrl(text)) {
    elements.btnScannerOpen.style.display = 'flex';
    elements.btnScannerOpen.onclick = () => window.open(text, '_blank', 'noopener,noreferrer');
  } else {
    elements.btnScannerOpen.style.display = 'none';
  }

  elements.btnScannerCopy.onclick = () => copyToClipboard(text);
  elements.btnScannerShare.onclick = () => shareContent('Taranan QR İçeriği', text, isUrl(text) ? text : '');
}

// Flip Camera
elements.btnFlipCamera.addEventListener('click', () => {
  state.facingMode = state.facingMode === 'environment' ? 'user' : 'environment';
  stopScanner();
  startScanner();
});

// Rescan Button
elements.btnScannerRescan.addEventListener('click', () => {
  elements.scannerResultCard.style.display = 'none';
  state.isScanning = true;
  elements.scannerStatus.textContent = 'QR kodu karenin içine hizalayın';
  requestScanFrame();
});

// ================= File Decoder (zbarimg) ================= //

function initFileDecoder() {
  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Lütfen geçerli bir görsel dosyası seçin.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Show preview
        elements.filePreviewImg.src = img.src;
        elements.filePreviewContainer.style.display = 'block';

        // Draw on canvas and decode with Rust Wasm
        sampleCanvas.width = img.naturalWidth;
        sampleCanvas.height = img.naturalHeight;
        sampleCtx.drawImage(img, 0, 0);

        const imgData = sampleCtx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
        try {
          const decoded = decode_from_rgba(img.naturalWidth, img.naturalHeight, imgData.data);
          onFileDecoded(decoded);
        } catch (err) {
          elements.fileResultText.textContent = 'Görselde QR kod tespit edilemedi veya okunamadı.';
          elements.fileResultCard.style.display = 'flex';
          elements.btnFileOpen.style.display = 'none';
          showToast('QR Kod bulunamadı 🔍');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  elements.dropzone.addEventListener('click', () => elements.fileInput.click());
  elements.fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
  });

  elements.dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.dropzone.classList.add('dragover');
  });

  elements.dropzone.addEventListener('dragleave', () => elements.dropzone.classList.remove('dragover'));
  elements.dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
  });
}

function onFileDecoded(text) {
  if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
  elements.fileResultText.textContent = text;
  elements.fileResultCard.style.display = 'flex';

  if (isUrl(text)) {
    elements.btnFileOpen.style.display = 'flex';
    elements.btnFileOpen.onclick = () => window.open(text, '_blank', 'noopener,noreferrer');
  } else {
    elements.btnFileOpen.style.display = 'none';
  }

  elements.btnFileCopy.onclick = () => copyToClipboard(text);
  elements.btnFileShare.onclick = () => shareContent('Görselden Çözülen QR', text, isUrl(text) ? text : '');
  showToast('QR Kod başarıyla çözüldü! 🎉');
}

// ================= QR Generator (qrencode) ================= //

let genDebounceTimer = null;

function updateQrGeneration() {
  if (!state.wasmReady) return;

  const text = elements.genInput.value.trim() || 'https://github.com/rust-lang/rust';
  const ecl = elements.genEcl.value;

  try {
    const svgString = encode_to_svg(text, ecl);
    elements.qrSvgHolder.innerHTML = svgString;
  } catch (err) {
    console.error('QR encode error:', err);
    showToast('QR kod oluşturulamadı');
  }
}

function initGenerator() {
  elements.genInput.addEventListener('input', () => {
    clearTimeout(genDebounceTimer);
    genDebounceTimer = setTimeout(updateQrGeneration, 200);
  });

  elements.genEcl.addEventListener('change', updateQrGeneration);

  // Download SVG
  elements.btnDownloadSvg.addEventListener('click', () => {
    const svgEl = elements.qrSvgHolder.querySelector('svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qrcode-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Vektörel SVG indirildi! 📐');
  });

  // Download High-Res PNG
  elements.btnDownloadPng.addEventListener('click', () => {
    const text = elements.genInput.value.trim() || 'https://github.com/rust-lang/rust';
    const ecl = elements.genEcl.value;

    try {
      const matrixData = encode_to_matrix(text, ecl);
      const width = matrixData.width;
      const modules = matrixData.modules;

      const scale = 24; // 24x scale gives crystal sharp PNG
      const border = 4;
      const totalWidth = (width + border * 2) * scale;

      const pngCanvas = document.createElement('canvas');
      pngCanvas.width = totalWidth;
      pngCanvas.height = totalWidth;
      const pctx = pngCanvas.getContext('2d');

      // White background
      pctx.fillStyle = '#ffffff';
      pctx.fillRect(0, 0, totalWidth, totalWidth);

      // Dark modules
      pctx.fillStyle = '#000000';
      for (let y = 0; y < width; y++) {
        for (let x = 0; x < width; x++) {
          if (modules[y * width + x] === 1) {
            pctx.fillRect((x + border) * scale, (y + border) * scale, scale, scale);
          }
        }
      }

      pngCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qrcode-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Yüksek çözünürlüklü PNG indirildi! 🖼️');
      }, 'image/png');
    } catch (err) {
      console.error('PNG generate error:', err);
      showToast('PNG oluşturulamadı');
    }
  });

  // Share QR
  elements.btnShareQr.addEventListener('click', async () => {
    const text = elements.genInput.value.trim();
    if (!text) {
      showToast('Paylaşmak için bir metin girin');
      return;
    }
    shareContent('Oluşturulan QR Kod', text, isUrl(text) ? text : '');
  });
}

// App Startup
document.addEventListener('DOMContentLoaded', () => {
  registerServiceWorker();
  initFullscreenToggle();
  initTabs();
  initFileDecoder();
  initGenerator();
  initializeWasm().then(() => {
    // Start camera by default on initial scan tab
    startScanner();
  });
});
