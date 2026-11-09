import { List } from "./workflow/list.js";

export class Dispatcher<T> {
      private readonly listeners: Map<string, List<Consumer<T>>> = new Map;

      public dispatch(event: string, value: T) {
            if (!this.listeners.has(event)) {
                  return this;
            }
            const subs = this.listeners.get(event);
            for (const sub of subs!) {
                  sub(value);
            }
            return this;
      }
      public listen(event: string, f: Consumer<T>) {
            if (!this.listeners.has(event)) {
                  this.listeners.set(event, new List(f));
                  return this;
            }
            this.listeners.get(event)?.append(f);
            return this;
      }
}