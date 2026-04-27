import { Actor } from 'apify';
import { execSync } from 'child_process';
import fs from 'fs';

await Actor.init();

const input = await Actor.getInput();

const {
    text = "Hola, audio generado con Piper",
    model = "/app/models/es_ES-davefx-medium.onnx",
} = input;

const wavFile = "output.wav";
const mp3File = "output.mp3";
const textFile = "input.txt";

// Guardar texto
fs.writeFileSync(textFile, text);

// 1. Generar WAV con Piper
const piperCmd = `piper --model ${model} --output_file ${wavFile} < ${textFile}`;
console.log("Piper:", piperCmd);
execSync(piperCmd, { stdio: 'inherit' });

// 2. Convertir WAV → MP3 con FFmpeg
const ffmpegCmd = `ffmpeg -i ${wavFile} -vn -ar 44100 -ac 2 -b:a 192k ${mp3File}`;
console.log("FFmpeg:", ffmpegCmd);
execSync(ffmpegCmd, { stdio: 'inherit' });

// 3. Subir MP3 a Apify KV Store
const store = await Actor.openKeyValueStore();

await store.setValue('output.mp3', fs.readFileSync(mp3File), {
    contentType: 'audio/mpeg',
});

// 4. Generar LINK REAL
const storeInfo = await store.getInfo();

const fileUrl = `https://api.apify.com/v2/key-value-stores/${storeInfo.id}/records/output.mp3`;

await Actor.pushData({
    status: "ok",
    url: fileUrl
});

console.log("MP3 URL:", fileUrl);

await Actor.exit();
