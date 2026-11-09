export class Provider {
      private static readonly providers: Map<Class, {}> = new Map;
      public static of<T extends {}>(constructor: Class<T>): T {
            const provider = this.providers.get(constructor);
            if (!provider) {
                  throw new Error(`invalid provider was not initialized ${constructor}`)
            }
            return provider as T;
      }
      public static set<I extends {}, T extends I>(constructor: Class<I>, instance: T) {
            this.providers.set(constructor, instance);
      }
}