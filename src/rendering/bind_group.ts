import { Pipeline, RenderingContext } from "./context.js";
import { Optional } from '../controller/workflow/list.js';

type UniformFieldDescriptor = {
      index: number, 
      components: number, 
      byte: number,
}
type UniformField = {
      index: number, 
      components: number, 
      byte: number,
      target: ClassAccessorDecoratorTarget<UniformBuffer, number[]>
}
export function field({index, components, byte}: UniformFieldDescriptor) {
      return <T extends UniformBuffer>(target: ClassAccessorDecoratorTarget<T, number[]>, ctx: ClassAccessorDecoratorContext<T, number[]>): ClassAccessorDecoratorResult<T, number[]> => {
            ctx.addInitializer(function () {
                  this.fields[index] = { index, components, byte, target };
            })
            return {
                  init(v) {
                        return v.length == components ? v: new Array(components).fill(0);
                  },
                  set(value) {
                        this.setValue(index, value);
                        target.set.call(this, value);
                  }
            }
      }
}

declare global {
      enum GPUBufferUsage {
            UNIFORM,
            COPY_DST
      }
}

interface UniformResource {
      asResource(): GPUBindingResource;
}

export class UniformBuffer implements UniformResource {
      public readonly fields: UniformField[] = [];
      private readonly values: Optional<Float32Array> = Optional.none();
      private readonly buffer: Optional<GPUBuffer> = Optional.none();
      private dirty: boolean = true;

      public static create<T extends UniformBuffer>(constructor: new(ctx: RenderingContext) => T, ctx: RenderingContext): T {
            const obj = new constructor(ctx);
            obj.initialize();
            return obj;
      }


      constructor(private readonly ctx: RenderingContext) {}

      public initialize() {
            let size = 0;
            let arraySize = 0;

            for (const field of this.fields) {
                  //this.fields[fields[i].index] = fields[i];
                  size += field.byte * field.components;
                  arraySize += field.components;
            }
            this.values.fill(new Float32Array(arraySize));
            this.buffer.fill(this.ctx.device.createBuffer({ size, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, }));
            for (const field of this.fields) {
                  this.setValue(field.index, field.target.get.call(this))
            }
      }

      public setValue(index: number, values: number[]) {
            if (values.length != this.fields[index].components) {
                  throw new RangeError(`invalid value size. expected size of ${this.fields[index].components}, obtained ${values.length}`);
            }
            let offset = 0;
            for (let i = 0; i < index; i++) {
                  offset += this.fields[i].components;
            }
            this.values.get().set(values, offset);
      }     

      public flush() {
            if (!this.dirty) {
                  return;
            }
            this.dirty = false;
            this.ctx.device.queue.writeBuffer(this.buffer.get(), 0, this.values.get());
      }

      public asResource(): GPUBindingResource {
            return this.buffer.get();
      }
}

export function binding(i: number) {
      return <T extends BindGroupLayout, K extends UniformResource>(target: ClassAccessorDecoratorTarget<T, K>, ctx: ClassAccessorDecoratorContext<T, K>): ClassAccessorDecoratorResult<T, K> => {
            return {
                  set(value) {
                        if (this.entries[i]) {
                              throw new Error('invalid assignment of already in use binding ' + i)
                        }
                        this.entries[i] = value;
                        target.set.call(this, value);
                  }
            }
      }
}

export class BindGroup {
      constructor(private readonly group: number, private readonly bindGroup: GPUBindGroup) {}

      public bind(pass: GPURenderPassEncoder) {
            pass.setBindGroup(this.group, this.bindGroup)
      }
}

export class BindGroupLayout {
      public readonly entries: UniformResource[] = []

      constructor(private readonly ctx: RenderingContext) {}

      public createInstance(groupIndex: number, pipeline: Pipeline) {
            const group = this.ctx.device.createBindGroup({
                  label: `group ${groupIndex} for pipeline ${pipeline.pipeline.label}`,
                  layout: pipeline.pipeline.getBindGroupLayout(groupIndex),
                  entries: this.entries.map((v,i) => ({ binding: i, resource: v.asResource() }))
            });
            return new BindGroup(groupIndex, group);
      }
}