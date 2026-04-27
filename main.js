import { execSync } from "child_process";
import fs from "fs";
import { Actor } from "apify";

await Actor.init();

// Texto de entrada
const input = await Actor.getInput();
const text = input?.text || "Hola, esto es una prueba de voz con Piper";

// Archivos
const wavPath = "/tmp/output.wav";
const mp3Path = "/tmp/output.mp3";

// 1. Generar WAV con Piper
execSync(
  `echo "${text}" | /opt/piper/piper --model /models/model.onnx --output_file ${wavPath}`
);

// 2. Convertir a MP3 con ffmpeg
execSync(
  `ffmpeg -y -i ${wavPath} -codec:a libmp3lame -qscale:a 2 ${mp3Path}`
);

// 3. Subir a Key-Value Store
const store = await Actor.openKeyValueStore();
const fileBuffer = fs.readFileSync(mp3Path);

await store.setValue("output.mp3", fileBuffer, {
  contentType: "audio/mpeg",
});

// 4. URL limpia
const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/output.mp3?disableRedirect=true`;

console.log("URL:", url);

// Output final
await Actor.setValue("OUTPUT", { url });

await Actor.exit();
