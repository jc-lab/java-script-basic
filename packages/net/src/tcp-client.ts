import type {
  Socket,
  TcpNetConnectOpts,
  SocketReadyState,
  AddressInfo,
  SocketConnectOpts,
  TcpSocketConnectOpts
} from 'net';
import * as streams from 'stream';
import {Synchronized} from 'node-synchronized';
import {
  TextEncoder,
  TextDecoder,
  EventLoop,
  SelectionContext,
  getDefaultEventLoop,
  binaryEncode,
  binaryDecode
} from '@java-script/common';
import {
  SelectionKey,
  SocketChannel,
  InetSocketAddress,
  ByteBuffer
} from './binding';
import {
  Buffer
} from 'buffer';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

type SimpleCallback = (err?: any) => void;

interface WriteContext {
  data: Buffer;
  callback: (err: any) => void;
}

interface ReadContext {
  size: number;
  buffer: java.nio.ByteBuffer;
  reading: boolean;
}

export class TcpClient extends streams.Duplex implements Socket {
  private queue: Synchronized = new Synchronized();
  private readCallback: SimpleCallback | null = null;
  private currentRead: ReadContext = {
    size: 0,
    buffer: null as any,
    reading: false
  };
  private pendingWrite: WriteContext | null = null;
  private channel!: java.nio.channels.SocketChannel;
  private selectionContext: SelectionContext | null = null;
  private _readyState: SocketReadyState = 'closed';

  constructor(
    private readonly eventLoop: EventLoop = getDefaultEventLoop(),
  ) {
    super();
  }

  localAddress?: string | undefined;
    localPort?: number | undefined;
    remoteAddress?: string | undefined;
    remoteFamily?: string | undefined;
    remotePort?: number | undefined;
    timeout?: number | undefined;

  address(): AddressInfo | {} {
    return {};
  }

  connect(options: SocketConnectOpts, connectionListener?: () => void): this;
  connect(port: number, host: string, connectionListener?: () => void): this;
  connect(port: number, connectionListener?: () => void): this;
  connect(path: string, connectionListener?: () => void): this;
  connect(a1: SocketConnectOpts | number | string, a2?: (() => void) | string | undefined, a3?: (() => void) | undefined): this {
    let connectionListener: (() => void) | undefined = undefined;
    const defaultOptions: TcpSocketConnectOpts = {
      host: '127.0.0.1',
      port: 0
    };
    const options: TcpSocketConnectOpts = Object.assign(defaultOptions, (typeof a1 === 'object') ? a1 as TcpSocketConnectOpts : (() => {
      if (typeof a1 === 'string') {
        throw new Error('invalid argument');
      } else {
        if (typeof a3 === 'function')
          connectionListener = a3;
        else if (typeof a2 === 'function')
          connectionListener = a2;
        return {
          port: a1,
          host: (typeof a2 === 'string') ? a2 : undefined
        } as TcpNetConnectOpts;
      }
    })());

    const channel = SocketChannel.open();
    channel.configureBlocking(false);

    this.channel = channel;
    this.eventLoop.registerChannel(
      channel,
      SelectionKey.OP_CONNECT,
      (selectionKey) => {
        try {
          if (selectionKey.isConnectable()) {
            if (channel.isConnectionPending()) {
              channel.finishConnect();
            }
            this._readyState = 'open';
            if (connectionListener) {
              connectionListener();
            }
            this.emit('connect');
            this.emit('ready');
          } else if (selectionKey.isReadable()) {
            const size = this.currentRead.size;
            if (!this.currentRead.buffer || this.currentRead.buffer.capacity() < size) {
              this.currentRead.buffer = ByteBuffer.allocate(size);
            }
            this.currentRead.buffer.limit(size);
            const readableSize = channel.read(this.currentRead.buffer);
            this.currentRead.buffer.flip();
            if (readableSize > 0) {
              const bytes = binaryDecode(this.currentRead.buffer.array(), readableSize);
              this.currentRead.buffer.clear();
              this._updateOps();
              this.push(bytes);
            } else {
              this.push(null);
              this.destroy();
            }
          } else if (selectionKey.isWritable()) {
            this.callWriteCallback();
            this._updateOps();
          }
        } catch (e) {
          let handled = false;
          handled = (handled) ? handled : selectionKey.isWritable() && this.callWriteCallback(e);
          if (!handled) {
            this.emit('error', e);
          }
        }
      })
      .then((selectionContext) => {
        this.selectionContext = selectionContext;
        const socketAddress = new InetSocketAddress(options.host, options.port);

        this._readyState = 'opening';
        channel.connect(socketAddress);
        print('connecting2');
      })
      .catch((err) => {
        this.emit('error', err);
      });

    return this;
  }

  private callWriteCallback(err?: any): boolean {
    const pendingWrite = this.pendingWrite;
    this.pendingWrite = null;
    if (pendingWrite) {
      const byteBuffer = ByteBuffer.wrap(binaryEncode(pendingWrite.data));
      this.channel.write(byteBuffer);
      return true;
    }
    return false;
  }


  /**
   * Sends data on the socket. The second parameter specifies the encoding in the
   * case of a string. It defaults to UTF8 encoding.
   *
   * Returns `true` if the entire data was flushed successfully to the kernel
   * buffer. Returns `false` if all or part of the data was queued in user memory.`'drain'` will be emitted when the buffer is again free.
   *
   * The optional `callback` parameter will be executed when the data is finally
   * written out, which may not be immediately.
   *
   * See `Writable` stream `write()` method for more
   * information.
   * @since v0.1.90
   * @param [encoding='utf8'] Only used when data is `string`.
   */
  write(buffer: Uint8Array | string, cb?: (err?: Error) => void): boolean;
  write(str: any, encoding?: BufferEncoding, cb?: (err?: Error) => void): boolean;
  write(a: Uint8Array | string, b?: any, c?: any): boolean {
    return super.write(a, b, c);
  }

  _read(size: number) {
    if (this.connecting || !this.channel) {
      this.once('connect', () => this._read(size));
    } else if (this.isConnected()) {
      this.currentRead.size = size;
      this._readStart();
    }
  }

  _write(chunk: any, encoding: BufferEncoding, callback: (error?: (Error | null)) => void) {
    this.queue.synchronized(() => new Promise<void>((resolve) => {
      this.pendingWrite = {
        callback: (err) => {
          callback(err);
          resolve();
        },
        data: chunk
      };
      try {
        this._updateOps();
      } catch (e: any) {
        this.pendingWrite = null;
        callback(e);
      }
    }));
  }

  _destroy(error: Error | null, callback: (error: (Error | null)) => void) {
    this._readyState = 'closed';
    if (this.selectionContext) {
      this.selectionContext.close();
    }
  }

  eventNames(): Array<string | symbol> {
    return [];
  }

  getMaxListeners(): number {
    return 0;
  }

  listenerCount(eventName: string | symbol): number {
    return 0;
  }

  listeners(eventName: string | symbol): Function[] {
    return [];
  }

  off(eventName: string | symbol, listener: (...args: any[]) => void): this {
    return this;
  }

  rawListeners(eventName: string | symbol): Function[] {
    return [];
  }

  ref(): this {
    throw new Error('NOT IMPL');
  }

  removeAllListeners(event?: string | symbol): this {
    throw new Error('NOT IMPL');
  }

  setKeepAlive(enable?: boolean, initialDelay?: number): this {
    throw new Error('NOT IMPL');
  }

  setMaxListeners(n: number): this {
    throw new Error('NOT IMPL');
  }

  setNoDelay(noDelay?: boolean): this {
    throw new Error('NOT IMPL');
  }

  setTimeout(timeout: number, callback?: () => void): this {
    throw new Error('NOT IMPL');
  }

  unref(): this {
    throw new Error('NOT IMPL');
  }

  pause(): this {
    if (this.currentRead.reading) {
      this.currentRead.reading = false;
      this._updateOps();
    }
    return super.pause();
  }

  resume(): this {
    if (this.isConnected() && !this.currentRead.reading) {
      this._readStart();
    }
    return super.resume();
  }

  public get bufferSize(): number {
    return 0;
  }

  public get bytesRead(): number {

    return 0;
  }

  public get bytesWritten(): number {

    return 0;
  }

  public get connecting(): boolean {
    return this._readyState === 'opening';
  }

  public get readyState(): SocketReadyState {
    return 'open';
  }

  private isConnected(): boolean {
    return this._readyState === 'open';
  }

  private _updateOps() {
    let ops: number = 0;
    if (this.currentRead.reading) {
      ops |= SelectionKey.OP_READ;
    }
    if (this.pendingWrite) {
      ops |= SelectionKey.OP_WRITE;
    }
    this.selectionContext!.key.interestOps(ops);
  }

  private _readStart(): void {
    if (!this.currentRead.reading) {
      this.currentRead.reading = true;
      this._updateOps();
    }
  }
}
