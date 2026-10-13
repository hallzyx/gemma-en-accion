# Gemma en acción

Demo de un chatbot que corre **Gemma 4 (E2B, ONNX)** dentro del navegador con **WebGPU** y **Transformers.js**, sin servidor de inferencia. Junto al chat hay un tour interactivo del código que explica cada fase: detección de GPU, procesador, carga del modelo, plantilla de chat, tensores, generación token a token y streaming.

## Cómo usarlo

1. Abre `index.html` en Chrome o Edge 113+ (con WebGPU), idealmente servido con un servidor estático o GitHub Pages.
2. Pulsa **Cargar modelo**. La primera vez descarga varios GB; luego queda en la caché del navegador.
3. Conversa y sigue el código en el panel lateral. Con "Seguir la ejecución" activado, el tour salta al paso que se está ejecutando.

## Detalles técnicos

- Modelo: `onnx-community/gemma-4-E2B-it-ONNX` (`dtype: "q4f16"`, `device: "webgpu"`)
- Librería: `@huggingface/transformers@4.3.0` desde jsDelivr
- Sin build: `index.html` es la app; `sw.js`, `manifest.webmanifest` y los íconos son para el modo avión.

## Modo avión

Una vez preparado, el demo abre y responde sin conexión:

1. Abre la página **con internet** desde HTTPS, `localhost` o GitHub Pages (los service workers no funcionan en `file://` ni dentro de visores aislados).
2. Pulsa **Cargar modelo** y espera a que termine. El indicador de la cabecera pasa a «Listo para modo avión».
3. Activa el modo avión y recarga: la página, las librerías y el modelo salen de la caché del navegador.

Cómo funciona: `sw.js` guarda la página y las librerías (jsDelivr y Google Fonts); el modelo y el runtime de ONNX los guarda Transformers.js en Cache Storage. Los archivos chicos y opcionales que no existen en el repo del modelo se devuelven como 404 sin red, para que la carga desde caché no se rompa.

Si cambias `index.html`, sube el número de `CACHE` en `sw.js` para que los visitantes reciban la versión nueva. También se puede instalar como app desde el menú del navegador.
