export class RenderingContext {
      public static async create(canvas: HTMLCanvasElement = document.createElement('canvas')) {
            const adapter = await navigator.gpu?.requestAdapter();
            const device = await adapter?.requestDevice();
            if (!device) {
                  throw new Error('adapter not found')
            }
            const context = canvas.getContext('webgpu') as GPUCanvasContext;
            const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
            context?.configure({
                  device,
                  format: presentationFormat,
            });
            return new RenderingContext(
                  device,
                  context,
                  presentationFormat
            );
      }
      private constructor(
            public readonly device: GPUDevice,
            public readonly context: GPUCanvasContext,
            public readonly format: GPUTextureFormat,
      ) {}
}

export abstract class Pass {
      private readonly pass: GPURenderPassDescriptor;
      constructor(protected readonly ctx: RenderingContext) {
            this.pass = {
                  label: '',
                  colorAttachments: [{
                        clearValue: [0.1, 0.1, 0.1, 0.],
                        loadOp: 'clear',
                        storeOp: 'store',
                        view: ctx.context.getCurrentTexture().createView()
                  }]
            }
      }
      protected abstract render(pass: GPURenderPassEncoder): void;

      public clearColor(color: number[]) {
            this.pass.colorAttachments[0]!.clearValue = color;
            return this;
      }

      public run(encoder:  GPUCommandEncoder) {
            this.pass.colorAttachments[0]!.view = this.ctx.context.getCurrentTexture().createView();
            const pass = encoder.beginRenderPass(this.pass);
            this.render(pass);
            pass.end();
      }
}
export class CommandBuffer {
      private readonly passes: Pass[] = [];
      constructor(private readonly ctx: RenderingContext) {}

      public use(pass: Pass) {
            this.passes.push(pass);
            return this;
      }
      public render() {
            const encoder = this.ctx.device.createCommandEncoder({ label: 'command encoder' });

            for (const pass of this.passes) {
                  pass.run(encoder);
            }
            return encoder.finish();
      }
}

export class Renderer {
      private readonly buffers: CommandBuffer[] = [];

      constructor(private readonly ctx: RenderingContext) {}
      public use(buffer: CommandBuffer) {
            this.buffers.push(buffer);
            return this;
      }
      public render() {
            const queue = this.buffers.map(buffer => buffer.render())
            this.ctx.device.queue.submit(queue);     
      }
}


export class Module {
      public readonly module: GPUShaderModule;
      constructor(ctx: RenderingContext, code: string) {
            this.module = ctx.device.createShaderModule({
                  label: 'shader module for code: ' + code,
                  code
            })
      }
}

export class Pipeline {
      public readonly pipeline: GPURenderPipeline;

      constructor(ctx: RenderingContext, shader: Module) {
            this.pipeline = ctx.device.createRenderPipeline({
                  label: `pipeline for module ${shader.module.label}`,
                  layout: 'auto',
                  vertex: {
                        module: shader.module
                  },
                  fragment: {
                        module: shader.module,
                        targets: [{ format: ctx.format}]
                  }
            });
      }
}