import type {
  Socket,
  NetConnectOpts
} from 'net';
import {
  TcpClient
} from './tcp-client';

/**
 * Aliases to {@link createConnection}.
 *
 * Possible signatures:
 *
 * * {@link connect}
 * * {@link connect} for `IPC` connections.
 * * {@link connect} for TCP connections.
 */
export function connect(options: NetConnectOpts, connectionListener?: () => void): Socket;
export function connect(port: number, host?: string, connectionListener?: () => void): Socket;
export function connect(path: string, connectionListener?: () => void): Socket;
export function connect(a1: NetConnectOpts | number | string, a2?: (() => void) | string, a3?: () => void): Socket {
  if ((typeof a1 === 'number') || (typeof a1 === 'object' && 'port' in a1)) {
    const tcpClient = new TcpClient();
    tcpClient.connect(a1 as any, a2 as any, a3);
    return tcpClient;
  } else {
    throw new Error('Not supported protocol');
  }
}
