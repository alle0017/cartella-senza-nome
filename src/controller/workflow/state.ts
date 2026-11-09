export class State {
      public readonly id: string = crypto.randomUUID();
      public merge(other: this): this {
            return this;
      }
}
