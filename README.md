# Gemma en acción

Demo de un chatbot que corre **Gemma 4 (E2B, ONNX)** dentro del navegador con **WebGPU** y **Transformers.js**, sin servidor de inferencia. Junto al chat hay un tour interactivo del código que explica cada fase: detección de GPU, procesador, carga del modelo, plantilla de chat, tensores, generación token a token y streaming.

## Cómo usarlo

1. Abre `index.html` en Chrome o Edge 113+ (con WebGPU), idealmente servido con un servidor estático o GitHub Pages.
2. Pulsa **Cargar modelo**. La primera vez descarga varios GB; luego queda en la caché del navegador.
3. Conversa y sigue el código en el panel lateral. Con "Seguir la ejecución" activado, el tour salta al paso que se está ejecutando.

## Detalles técnicos

- Modelo: `onnx-community/gemma-4-E2B-it-ONNX` (`dtype: "q4f16"`, `device: "webgpu"`)
- Librería: `@huggingface/transformers@4.3.0` desde jsDelivr
- Un solo archivo, sin build.
