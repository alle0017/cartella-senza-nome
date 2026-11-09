import { CommandBuffer, Module, Pass, Pipeline, Renderer, RenderingContext } from "./rendering/context.js";
import {BindGroup, BindGroupLayout, binding, field, UniformBuffer } from "./rendering/bind_group.js";




const shader = `
struct OurStruct {
      color: vec4f,
      scale: vec2f,
      offset: vec2f,
};

@group(0) @binding(0) var<uniform> ourStruct: OurStruct;

@vertex fn vs(
      @builtin(vertex_index) vertexIndex : u32
) -> @builtin(position) vec4f {
      let pos = array(
            vec2f( 0.0,  0.5),  // top center
            vec2f(-0.5, -0.5),  // bottom left
            vec2f( 0.5, -0.5)   // bottom right
      );

      return vec4f(
      pos[vertexIndex] * ourStruct.scale + ourStruct.offset, 0.0, 1.0);
}

@fragment fn fs() -> @location(0) vec4f {
      return ourStruct.color;
}
`
export class OurStructUBO extends UniformBuffer {
      @field({ index: 0, components: 4, byte: Float32Array.BYTES_PER_ELEMENT }) accessor color: number[] = [0, 1, 0, 1];
      @field({ index: 1, components: 2, byte: Float32Array.BYTES_PER_ELEMENT }) accessor scale: number[] = [];
      @field({ index: 2, components: 2, byte: Float32Array.BYTES_PER_ELEMENT }) accessor offset: number[] = [-0.5, -0.25];
}

class BasicBindGroup extends BindGroupLayout {
      @binding(0) accessor struct: OurStructUBO;

      constructor(ctx: RenderingContext) {
            super(ctx);
            this.struct = UniformBuffer.create(OurStructUBO, ctx);
      }
}

class BasicRenderingPass extends Pass {
      private readonly layout: BasicBindGroup;
      private readonly pipeline: Pipeline;
      private readonly group: BindGroup;

      constructor(ctx: RenderingContext) {
            super(ctx)
            this.layout = new BasicBindGroup(ctx);
            this.pipeline = new Pipeline(ctx, new Module(ctx, shader));
            this.group = this.layout.createInstance(0, this.pipeline);
      }
      protected render(pass: GPURenderPassEncoder): void {
            const aspect = this.ctx.context.canvas.width / this.ctx.context.canvas.height;
            this.layout.struct.scale = [0.5 / aspect, 0.5];
            this.layout.struct.flush();
            pass.setPipeline(this.pipeline.pipeline);
            this.group.bind(pass);
            pass.draw(3);
      }
}
RenderingContext
.create()
.then(ctx => {
      document.body.append(ctx.context.canvas as HTMLCanvasElement)
      const renderer = new Renderer(ctx);
      renderer.use(new CommandBuffer(ctx).use(new BasicRenderingPass(ctx)));
      renderer.render();
}).catch(console.error)