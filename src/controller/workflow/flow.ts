import { List } from "./list.js";
import { State } from "./state.js";
import { FlowCommand, Reference, ForkFlowCommand, ConditionalFlowCommand, SubFlowCommand, NoneFlow } from "./flow_commands.js";
import { Actor } from "./actor.js";

export class Flow<T extends State> {
      public static from<T extends State>(actor: Actor<T>) {
            return new Flow<T>(new Reference(actor));
      }

      public static ofNone<T extends State>() {
            return new Flow(new NoneFlow<T>());
      }

      private readonly stream: List<FlowCommand<T>>;

      constructor(init: FlowCommand<T>) {
            this.stream = new List(init);
      }
      public subflow(flow: Flow<T>) {
            this.stream.append(new SubFlowCommand(flow));
            return this;
      }
      public fork(...flows: Flow<T>[]) {
            this.stream.append(new ForkFlowCommand(flows));
            return this;
      }
      public when<Z extends Record<string, Flow<T>>>(condition: (state: T) => (keyof Z | Promise<keyof Z>), actors: Z) {
            this.stream.append(new ConditionalFlowCommand(condition, actors));
            return this;
      }
      public pipe(actor: Actor<T>) {
            this.stream.append(new Reference(actor));
            return this;
      }
      public async run(state: T): Promise<T> {
            for (const node of this.stream) {
                  state = await node.run(state);
            }
            return state;
      }
}