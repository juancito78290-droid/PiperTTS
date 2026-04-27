import { execSync } from "child_process";
import fs from "fs";
import { Actor } from "apify";

await Actor.init();

const input = await Actor.getInput() || {};
const TEXT = input.text || "Hola, audio generado correctamente";

const WAV = "/tmp/output.wav";
const MP3 = "/tmp/output.mp3";
const MODEL = "/models/model.onnx";

// Validaciones
if (!fs.existsSync("/opt/piper/piper")) {
    throw new Error("Piper no existe");
}
if (!fs.existsSync(MODEL)) {
    throw new Error("Modelo no existe");
}

// 1. Generar WAV
execSync(
    `echo "${TEXT}" | /opt/piper/piper --model ${MODEL} --output_file ${WAV}`,
    { stdio: "inherit" }
);

// 2. Convertir a MP3
execSync(
    `ffmpeg -y -i ${WAV} -codec:a libmp3lame -b:a 128k ${MP3}`,
    { stdio: "inherit" }
);

// Validar
if (!fs.existsSync(MP3)) {
    throw new Error("No se generó el MP3");
}

// 3. Subir a Key-Value Store
const store = await Actor.openKeyValueStore();

// nombre único
const key = `audio-${Date.now()}.mp3`;

await store.setValue(key, fs.readFileSync(MP3), {
    contentType: "audio/mpeg",
});

// 4. URL limpia (🔥 lo que quieres)
const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/${key}`;

// Output final
await Actor.setOutput({
    success: true,
    url,
    key,
});

console.log("✅ URL:", url);

await Actor.exit();
