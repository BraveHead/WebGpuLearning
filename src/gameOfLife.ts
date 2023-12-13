import GameOfVert from './shaders/gameOfLife.vert.wgsl?raw'

async function init() {
    // 第一步 获取device
    const canvas = document.querySelector('#canvas') as HTMLCanvasElement;
    if(!canvas) {
        return;
    }
    if(!navigator.gpu) {
        throw new Error('Not support WebGPU');
    };
    const adapter  =  await navigator.gpu.requestAdapter(); 
    if(!adapter) {
        throw new Error('Not support WebGPU Adapter!');
    };
    const device = await adapter.requestDevice();

    // 配置画布
    const context = canvas.getContext('webgpu');
    const canvasFormat = navigator?.gpu?.getPreferredCanvasFormat();
    context?.configure({
        device,
        format: canvasFormat
    })
    if(!context) {
        return
    }
    const vertices = new Float32Array([
        //   X,    Y,
        -0.8, -0.8, // Triangle 1 (Blue)
        0.8, -0.8,
        0.8,  0.8,

        -0.8, -0.8, // Triangle 2 (Red)
        0.8,  0.8,
        -0.8,  0.8,
    ])

    // 创建订点缓冲区
    const vertexBuffer = device.createBuffer({
        label: 'Cell vertices',
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    // 写入buffer到缓冲区
    device.queue.writeBuffer(vertexBuffer, 0, vertices);

    // 定义顶点布局
    const vertexBufferLayout : GPUVertexBufferLayout = {
        arrayStride: 2 * 4,
        attributes: [
            {
                format: 'float32x2',
                offset: 0,
                shaderLocation: 0
            }
        ]
    };

    // 定义定点着色器
    const cellShaderModule = device.createShaderModule({
        label: 'Cell shader',
        code: `
            @vertex
            fn vertextMain(@location(0) pos: vec2f) -> @builtin(position) vec4f {
                return vec4f(pos,0,1); // (X, Y, Z, W)
            }
            @fragment
                fn fragmentMain() -> @location(0) vec4f {
                return vec4f(1, 0, 0, 1);
            }
        `
    })

    // 创建渲染流水线
    const cellPipeline = device.createRenderPipeline({
        label: 'Cell pipeline',
        layout: 'auto',
        vertex: {
            module: cellShaderModule,
            entryPoint: 'vertextMain',
            buffers: [vertexBufferLayout]
        },
        fragment: {
            module: cellShaderModule,
            entryPoint: 'fragmentMain',
            targets: [
                {
                    format: canvasFormat
                }
            ]
        }
    })

    // 生成清除画布指令
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
        colorAttachments: [
            {
                view: context.getCurrentTexture().createView(),
                loadOp: 'clear',
                storeOp: 'store',
                clearValue: {
                    r: 0,
                    g: 0,
                    b: 1,
                    a: 1
                }
            }
        ]
    });
    pass.setPipeline(cellPipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.draw(vertices.length / 2); // 6 vertices
    pass.end();

    // 获取指令缓冲区
    const commandBuffer = encoder.finish();
    // 执行指令缓冲区
    device.queue.submit([commandBuffer]);
}   

init();