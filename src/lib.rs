use wasm_bindgen::prelude::*;
use qrcode::{EcLevel, QrCode};
use qrcode::render::svg;
use rqrr::PreparedImage;

fn parse_ec_level(ecl: &str) -> EcLevel {
    match ecl.to_uppercase().as_str() {
        "L" | "LOW" => EcLevel::L,
        "M" | "MEDIUM" => EcLevel::M,
        "Q" | "QUARTILE" => EcLevel::Q,
        "H" | "HIGH" => EcLevel::H,
        _ => EcLevel::M,
    }
}

/// Generates an SVG string from the provided text and error correction level (L, M, Q, H).
#[wasm_bindgen]
pub fn encode_to_svg(text: &str, ecl: Option<String>) -> Result<String, JsValue> {
    let level = parse_ec_level(ecl.as_deref().unwrap_or("M"));
    let code = QrCode::with_error_correction_level(text.as_bytes(), level)
        .map_err(|e| JsValue::from_str(&format!("QR encode error: {e}")))?;

    let svg_str = code
        .render::<svg::Color>()
        .min_dimensions(200, 200)
        .dark_color(svg::Color("#000000"))
        .light_color(svg::Color("#ffffff"))
        .build();

    Ok(svg_str)
}

/// Generates a binary matrix representation (1 for dark, 0 for light) of the QR code.
/// Returns a JSON object with: { width: usize, modules: Vec<u8> }
#[wasm_bindgen]
pub fn encode_to_matrix(text: &str, ecl: Option<String>) -> Result<JsValue, JsValue> {
    let level = parse_ec_level(ecl.as_deref().unwrap_or("M"));
    let code = QrCode::with_error_correction_level(text.as_bytes(), level)
        .map_err(|e| JsValue::from_str(&format!("QR encode error: {e}")))?;

    let width = code.width();
    let modules: Vec<u8> = code
        .to_colors()
        .into_iter()
        .map(|c| if c == qrcode::Color::Dark { 1 } else { 0 })
        .collect();

    let obj = js_sys::Object::new();
    js_sys::Reflect::set(&obj, &"width".into(), &(width as f64).into())?;
    
    let arr = js_sys::Uint8Array::new_with_length(modules.len() as u32);
    arr.copy_from(&modules);
    js_sys::Reflect::set(&obj, &"modules".into(), &arr)?;

    Ok(obj.into())
}

/// Decodes a QR code from RGBA pixel data (standard canvas / ImageData format).
/// Returns the decoded string if found, or an error.
#[wasm_bindgen]
pub fn decode_from_rgba(width: u32, height: u32, data: &[u8]) -> Result<String, JsValue> {
    let w = width as usize;
    let h = height as usize;
    if data.len() < w * h * 4 {
        return Err(JsValue::from_str("Invalid buffer length for given dimensions"));
    }

    // Convert RGBA to Grayscale using integer arithmetic for max performance:
    // Y = (77 * R + 150 * G + 29 * B) >> 8
    let mut grayscale = Vec::with_capacity(w * h);
    for chunk in data.chunks_exact(4).take(w * h) {
        let r = chunk[0] as u32;
        let g = chunk[1] as u32;
        let b = chunk[2] as u32;
        let y = ((77 * r + 150 * g + 29 * b) >> 8) as u8;
        grayscale.push(y);
    }

    decode_from_luma_slice(w, h, &grayscale)
}

/// Helper function to run rqrr detection on a grayscale buffer
fn decode_from_luma_slice(width: usize, height: usize, luma: &[u8]) -> Result<String, JsValue> {
    let mut img = PreparedImage::prepare_from_greyscale(width, height, |x, y| {
        luma[y * width + x]
    });

    let grids = img.detect_grids();
    if grids.is_empty() {
        return Err(JsValue::from_str("No QR code detected"));
    }

    for grid in grids {
        let mut buf = Vec::new();
        if let Ok(_metadata) = grid.decode_to(&mut buf) {
            let content = String::from_utf8(buf)
                .map_err(|e| JsValue::from_str(&format!("Decoded content is not valid UTF-8: {e}")))?;
            return Ok(content);
        }
    }

    Err(JsValue::from_str("Detected QR grid but failed to decode content (damaged or corrupted)"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encode_and_decode_roundtrip() {
        let sample_text = "https://github.com/rust-lang/rust";
        let code = QrCode::with_error_correction_level(sample_text.as_bytes(), EcLevel::M).unwrap();
        let width = code.width();
        let colors = code.to_colors();

        // Convert to grayscale image with some quiet zone (border) padding
        let border = 4;
        let total_w = width + border * 2;
        let total_h = width + border * 2;
        let mut luma = vec![255u8; total_w * total_h];

        for y in 0..width {
            for x in 0..width {
                let color = colors[y * width + x];
                let px = (y + border) * total_w + (x + border);
                luma[px] = if color == qrcode::Color::Dark { 0 } else { 255 };
            }
        }

        // Scale up 4x for realistic image scanning
        let scale = 4;
        let scaled_w = total_w * scale;
        let scaled_h = total_h * scale;
        let mut scaled_luma = vec![255u8; scaled_w * scaled_h];
        for sy in 0..scaled_h {
            for sx in 0..scaled_w {
                let ox = sx / scale;
                let oy = sy / scale;
                scaled_luma[sy * scaled_w + sx] = luma[oy * total_w + ox];
            }
        }

        let decoded = decode_from_luma_slice(scaled_w, scaled_h, &scaled_luma).expect("Failed to decode");
        assert_eq!(decoded, sample_text);
    }
}
