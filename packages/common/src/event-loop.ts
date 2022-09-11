import {
  CompletableFuture,
  LinkedBlockingQueue,
  Selector,
  Thread
} from './binding';

export type ChannelHandler = (selectionKey: java.nio.channels.SelectionKey) => void;

interface SelectableChannel {
  register( arg0:java.nio.channels.Selector, arg1:int ): java.nio.channels.SelectionKey;
  register( arg0:java.nio.channels.Selector, arg1:int, arg2:any /*java.lang.Object*/ ):java.nio.channels.SelectionKey;
}

export interface SelectionContext {
  handler: ChannelHandler;
  key: java.nio.channels.SelectionKey;
  close: () => void;
}

interface QueueTask {
  run: () => void;
  completableFuture: java.util.concurrent.CompletableFuture<any>;
}

export class EventLoop {
  private selector: java.nio.channels.Selector;
  private workerThread!: java.lang.Thread;
  private isRunning: boolean = true;

  private readonly workerQueue = new LinkedBlockingQueue<QueueTask>();

  constructor(selector?: java.nio.channels.Selector | undefined) {
    this.selector = selector || Selector.open();
  }

  public start(): void {
    this.workerThread = new Thread(() => {
      while (this.isRunning) {
        this.selectorLoop();
        this.queueLoop();
      }
    });
    this.workerThread.start();
  }

  public registerChannel(channel: SelectableChannel, ops: int, handler: ChannelHandler): Promise<SelectionContext> {
    const context: Partial<SelectionContext> = {
      handler
    };
    return this.queuedTask(() => channel.register(this.selector, ops, context))
      .then((key) => {
        context.key = key;
        context.close = () => {
          key.cancel();
        };
        return context as SelectionContext;
      });
  }

  public close() {
    this.isRunning = false;
    if (this.selector.isOpen()) {
      this.selector.close();
    }
    if (this.workerThread && this.workerThread.isAlive()) {
      this.workerThread.interrupt();
    }
  }

  private queuedTask<T>(run: () => T): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const completableFuture = new CompletableFuture<{value?: T, error?: Error}>();
      this.workerQueue.add({
        completableFuture,
        run: () => {
          try {
            const value = run();
            completableFuture.complete({value: value});
          } catch (error: any) {
            completableFuture.complete({error});
          }
        }
      });
      this.selector.wakeup();
      const result = completableFuture.get();
      if (result.value) {
        resolve(result.value);
      } else {
        reject(result.error);
      }
    });
  }

  private selectorLoop() {
    const count = this.selector.select();
    if (count) {
      const selectedKeys = this.selector.selectedKeys();
      const iterator = selectedKeys.iterator();
      while (iterator.hasNext()) {
        const selectionKey = iterator.next();
        const context = selectionKey.attachment() as SelectionContext;
        if (context) {
          context.handler(selectionKey);
        }
        iterator.remove();
      }
    }
  }

  private queueLoop() {
    let task: QueueTask | null;
    while ((task = this.workerQueue.poll()) != null) {
      task.run();
    }
  }
}

let defaultEventLoop!: EventLoop;
export function getDefaultEventLoop() {
  if (!defaultEventLoop) {
    defaultEventLoop = new EventLoop();
    defaultEventLoop.start();
  }
  return defaultEventLoop;
}
