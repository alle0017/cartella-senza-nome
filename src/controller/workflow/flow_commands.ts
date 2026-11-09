import { State } from "./state.js";
import { type Flow } from "./flow.js";
import { Actor } from "./actor.js";
export interface FlowCommand<T extends State> {
      run(state: T): Promise<T> | T
}

export class ForkFlowCommand<T extends State> implements FlowCommand<T> {
      constructor(private readonly flows: Flow<T>[]) {}
      public async run(state: T): Promise<T> {
            const promises = this.flows.map(flow => flow.run(state));
            return Promise.all(promises).then(states => states.reduce((p,c) => p.merge(c), state))
      }
}

export class SubFlowCommand<T extends State> extends ForkFlowCommand<T> {
      constructor(flow: Flow<T>) {
            super([flow]);
      }
}
export class ConditionalFlowCommand<T extends State, Z extends Record<string, Flow<T>>> implements FlowCommand<T> {
      constructor(private readonly condition: (state: T) => (keyof Z | Promise<keyof Z>), private readonly actors: Z) {}
      public async run(state: T): Promise<T> {
            const actor = await this.condition(state);
            return this.actors[actor].run(state);
      }
}
export class Reference<T extends State> implements FlowCommand<T> {
      constructor(private readonly actor: Actor<T>) {}
      public run(state: T) {
            return this.actor(state);
      }
}
export class NoneFlow<T extends State> implements FlowCommand<T> {
      public run(state: T): T {
            return state;
      }
}