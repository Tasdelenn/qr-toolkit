#!/usr/bin/env bash
set -e

echo "🦀 Building Rust WebAssembly binary for QR Toolkit..."
cargo build --target wasm32-unknown-unknown --release

echo "📦 Running wasm-bindgen..."
mkdir -p www/pkg
wasm-bindgen target/wasm32-unknown-unknown/release/qr_toolkit.wasm \
  --out-dir www/pkg \
  --target web

echo "✨ Build complete! Files are ready in www/"
