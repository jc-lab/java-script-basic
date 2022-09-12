import {
  Selector
} from './binding';

export type ChannelHandler = (selectionKey: java.nio.channels.SelectionKey) => Promise<void> | void;

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
  resolve: () => void;
  run: () => void;
  completableFuture: java.util.concurrent.CompletableFuture<any>;
}

export class EventLoop {
  private selector: java.nio.channels.Selector;
  private isRunning: boolean = true;

  constructor(selector?: java.nio.channels.Selector | undefined) {
    this.selector = selector || Selector.open();
  }

  public start(): void {
    const next = () => {
      if (!this.isRunning) {
        return ;
      }
      setTimeout(() => {
        this.selectorLoop()
          .then(() => {
            next();
          });
      }, 1);
    };
    next();
  }

  public registerChannel(channel: SelectableChannel, ops: int, handler: ChannelHandler): Promise<SelectionContext> {
    const context: Partial<SelectionContext> = {
      handler
    };
    const key = channel.register(this.selector.wakeup(), ops, context)
    context.key = key;
    context.close = () => {
      key.cancel();
    };
    return Promise.resolve(context as SelectionContext);
  }

  public close() {
    this.isRunning = false;
    if (this.selector.isOpen()) {
      this.selector.close();
    }
  }

  public sendTaskToMainThread(run: () => void): void {
    setTimeout(run, 0);
  }

  private selectorLoop(): Promise<void> {
    return new Promise<void>((resolve) => {
      const count = this.selector.selectNow();
      if (!count) {
        resolve();
      }
      const selectedKeys = this.selector.selectedKeys();
      const iterator = selectedKeys.iterator();
      const next = () => {
        if (iterator.hasNext()) {
          const selectionKey = iterator.next();
          const context = selectionKey.attachment() as SelectionContext;
          Promise.resolve()
            .then(() => {
              return context.handler(selectionKey);
            })
            .then(() => {
              iterator.remove();
              next();
            });
        } else {
          resolve();
        }
      };
      next();
    });
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
