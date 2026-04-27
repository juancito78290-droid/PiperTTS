import { execSync } from "child_process";
import fs from "fs";
import { Actor } from "apify";

await Actor.init();

const input = await Actor.getInput() || {};
const TEXT = (input.text || "Hola desde Piper").replace(/"/g, '\\"');

const WAV = "/tmp/output.wav";
const MP3 = "/tmp/output.mp3";
const MODEL = "/models/model.onnx";

// Generar WAV
execSync(
    `echo "${TEXT}" | /opt/piper/piper --model ${MODEL} --output_file ${WAV}`,
    { stdio: "inherit" }
);

// Convertir a MP3
execSync(
    `ffmpeg -y -i ${WAV} -codec:a libmp3lame -b:a 128k ${MP3}`,
    { stdio: "inherit" }
);

// Subir a KV Store
const store = await Actor.openKeyValueStore();
const key = `audio-${Date.now()}.mp3`;

await store.setValue(key, fs.readFileSync(MP3), {
    contentType: "audio/mpeg",
});

const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/${key}`;

await Actor.setOutput({ url });

console.log("✅ URL:", url);

await Actor.exit();
