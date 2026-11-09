import { Optional, State } from '../controller/workflow/index.js';

export class RenderingState extends State {
      device: Optional<GPUDevice> = Optional.none();
      context: Optional<GPUCanvasContext> = Optional.none();
      format: Optional<GPUTextureFormat> = Optional.none();
}