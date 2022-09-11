export * from './java-types';

export interface SelectionKeyStatic {
  readonly class:any;
  readonly OP_READ: number;
  readonly OP_WRITE: number;
  readonly OP_CONNECT: number;
  readonly OP_ACCEPT: number;
}

// export const SelectionKey: SelectionKeyStatic = Packages.java.nio.channels.SelectionKey;

