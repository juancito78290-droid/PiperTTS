import { execSync } from "child_process";
import fs from "fs";
import { randomUUID } from "crypto";
import { Actor } from "apify";

await Actor.init();

// INPUT
const input = await Actor.getInput();
const text = input?.text || "Hola, esto es una prueba con Piper.";

// IDs únicos
const id = randomUUID();

// Rutas
const wavPath = `/tmp/${id}.wav`;
const mp3Path = `/tmp/${id}.mp3`;

console.log("🧠 Generando audio con Piper...");

// Generar WAV con Piper
execSync(`echo "${text.replace(/"/g, '\\"')}" | piper \
--model /models/model.onnx \
--config /models/model.onnx.json \
--output_file ${wavPath}
`);

// Validar WAV
if (!fs.existsSync(wavPath)) {
    throw new Error("❌ Piper no generó el WAV");
}

console.log("🎧 Convirtiendo a MP3...");

// Convertir a MP3
execSync(`ffmpeg -y -i ${wavPath} -codec:a libmp3lame -qscale:a 2 ${mp3Path}`);

// Validar MP3
if (!fs.existsSync(mp3Path)) {
    throw new Error("❌ FFmpeg no generó el MP3");
}

console.log("☁️ Subiendo a Apify KV Store...");

// Subir a Key-Value Store (archivo público)
const store = await Actor.openKeyValueStore();

const fileName = `${id}.mp3`;

await store.setValue(fileName, fs.readFileSync(mp3Path), {
    contentType: "audio/mpeg",
});

// URL pública
const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/${fileName}`;

console.log("✅ URL generada:", url);

// OUTPUT
await Actor.setOutput({
    url,
    fileName,
});

await Actor.exit();
