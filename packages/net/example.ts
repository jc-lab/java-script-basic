// import {
//   InetSocketAddress,
//   SocketChannel,
//   ByteBuffer,
//   SelectionKey,
//   Selector,
//   // SelectionKeyEx,
//   Thread
// } from './src/binding';
//
// const addr = new InetSocketAddress('localhost', 11112);
// const client = SocketChannel.open();
// const selector = Selector.open();
//
// const ctx = {aa: 'asdads'};
//
// var workerThread = new Thread(() => {
//   while(1) {
//     print('THREAD');
//     Thread.sleep(1000);
//   }
// });
// workerThread.start();
//
// client.configureBlocking(false);
// client.register(selector, SelectionKey.OP_READ | SelectionKey.OP_CONNECT, ctx);
// client.connect(addr);
//
// let done = 0;
// while (!done) {
//   const count = selector.select();
//   if (count > 0) {
//     const selectedKeys = selector.selectedKeys();
//     const iterator = selectedKeys.iterator();
//     while (iterator.hasNext()) {
//       const selectionKey = iterator.next();
//       print('selectionKey : ', selectionKey, ':', selectionKey.attachment().aa);
//       if (selectionKey.isConnectable()) {
//         print('connected');
//         done = 1;
//
//         if (client.isConnectionPending()) {
//           try {
//             client.finishConnect();
//           } catch (e) {
//             print('a', e);
//             print('b', e.code);
//             print('c', e.name);
//             print('d', e.message);
//             print(JSON.stringify(e));
//           }
//         }
//       }
//     }
//   }
// }
//
// client.write(ByteBuffer.wrap(['1']));
// client.close();
//
//
//
// /*
//
//         InetSocketAddress crunchifyAddr = new InetSocketAddress("localhost", 1111);
//
//         //  selectable channel for stream-oriented connecting sockets
//         SocketChannel crunchifyClient = SocketChannel.open(crunchifyAddr);
//         log("Connecting to Server on port 1111...");
//         ArrayList<String> companyDetails = new ArrayList<String>();
//         // create a ArrayList with companyName list
//         companyDetails.add("Facebook");
//         companyDetails.add("Twitter");
//         companyDetails.add("IBM");
//         companyDetails.add("Google");
//         companyDetails.add("Crunchify");
//         for (String companyName : companyDetails) {
//             byte[] message = new String(companyName).getBytes();
//             ByteBuffer buffer = ByteBuffer.wrap(message);
//             crunchifyClient.write(buffer);
//             log("sending: " + companyName);
//             buffer.clear();
//             // wait for 2 seconds before sending next message
//             Thread.sleep(2000);
//         }
//
//         // close(): Closes this channel.
//         // If the channel has already been closed then this method returns immediately.
//         // Otherwise it marks the channel as closed and then invokes the implCloseChannel method in order to complete the close operation.
//         crunchifyClient.close();
//     }
//     private static void log(String str) {
//
//         System.out.println(str);
//     }
//  */

import * as net from './src';
import {Buffer} from 'buffer';

const aa = net.connect(11111, '127.0.0.1', () => {
  print('connected 1');
});
print('connecting...');
aa.on('error', (err) => {
  print('error', err);
})
aa.on('data', (data: Buffer) => {
  print('data', data.toString('utf-8'));
  aa.write(data, (err) => print('write ok', err));
});



