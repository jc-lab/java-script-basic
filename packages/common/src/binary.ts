import {Base64} from './binding';
import {
  Buffer
} from 'buffer';

export type ByteArray = any;

export function binaryEncode(bytes: Uint8Array): ByteArray {
  const buffer = Buffer.isBuffer(bytes) ? bytes.toString('base64') : Buffer.from(bytes);
  return Base64.getDecoder().decode(buffer);
}

export function binaryDecode<T extends Uint8Array = Uint8Array>(byteArray: ByteArray, length?: number): Buffer {
  // let out = output;
  // if (!out) {
  //   out = new Uint8Array(byteArray.length) as any;
  // }
  // return Buffer.from(Base64.getEncoder().encode(byteArray), 'base64');

  let buffer = Buffer.from(Array.from(byteArray) as any, 0, length || byteArray.length);
  if (length && (buffer.length > length)) {
    // Fix buffer
    buffer = buffer.subarray(0, length);
  }
  return buffer;
}
