type Class<T extends {} = {}> = new(...args: any[]) => T
type Consumer<T> = (value: T) => void;
