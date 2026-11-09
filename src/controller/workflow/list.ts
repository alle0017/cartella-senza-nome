export class Optional<T> {
      public static of<T>(value: T) {
            return new Optional(value);
      }
      public static none(): Optional<any> {
            return new Optional(undefined);
      }
      constructor(private value: T | undefined) {}

      public map<V>(f: (v: T) => V) {
            if (!this.value) {
                  return this as Optional<any> as Optional<V>
            }
            return Optional.of(f(this.value));
      }
      public isEmpty() {
            return this.value == undefined;
      }
      public swapIfEmpty(value: T) {
            if (this.isEmpty()) {
                  this.value = value;
            }
            return this;
      }
      public fill(value: T) {
            this.value = value;
            return this;
      }
      public get() {
            if (this.isEmpty()) {
                  throw new Error('no data to get')
            }
            return this.value as T;
      }
      public orElse(value: T): T {
            if (this.isEmpty()) {
                  return value;
            }
            return this.value!;
      }
}
class Node<T> {
      constructor(
            public readonly value: T,
            public readonly next: Optional<Node<T>> = Optional.none(),
      ) {}
}

export class List<T> {
      private readonly head: Node<T>;
      private tail: Node<T>;
      
      constructor(value: T) {
            this.head = new Node(value);
            this.tail = this.head;
      }

      public append(value: T) {
            const node = new Node(value);
            this.tail.next.swapIfEmpty(node);
            this.tail = node;
      }

      *[Symbol.iterator]() {
            let current: Optional<Node<T>> = Optional.of(this.head);

            while (!current.isEmpty()) {
                  const node = current.get();
                  yield node.value;
                  current = node.next;
            }
      }
}