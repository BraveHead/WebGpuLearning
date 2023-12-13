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
    pass.end();

    // 获取指令缓冲区
    const commandBuffer = encoder.finish();
    // 执行指令缓冲区
    device.queue.submit([commandBuffer]);
}   

init();