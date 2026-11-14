/* tslint:disable */
/* eslint-disable */
/**
 * Generates an SVG string from the provided text and error correction level (L, M, Q, H).
 */
export function encode_to_svg(text: string, ecl?: string | null): string;
/**
 * Generates a binary matrix representation (1 for dark, 0 for light) of the QR code.
 * Returns a JSON object with: { width: usize, modules: Vec<u8> }
 */
export function encode_to_matrix(text: string, ecl?: string | null): any;
/**
 * Decodes a QR code from RGBA pixel data (standard canvas / ImageData format).
 * Returns the decoded string if found, or an error.
 */
export function decode_from_rgba(width: number, height: number, data: Uint8Array): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly decode_from_rgba: (a: number, b: number, c: number, d: number) => [number, number, number, number];
  readonly encode_to_matrix: (a: number, b: number, c: number, d: number) => [number, number, number];
  readonly encode_to_svg: (a: number, b: number, c: number, d: number) => [number, number, number, number];
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
