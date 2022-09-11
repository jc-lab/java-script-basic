import * as iconv from 'iconv-lite';

export class TextEncoder {
  encode(input: string): Buffer {
    return iconv.encode(input, 'utf8');
  }
}

export class TextDecoder {
  encode(input: string): Buffer {
    return iconv.encode(input, 'utf8');
  }
}

export {
  iconv
};
