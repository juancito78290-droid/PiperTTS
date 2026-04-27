import { Actor } from 'apify';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

await Actor.init();

const input = await Actor.getInput();
const text = input?.text || "Hola, esto es una prueba";

const id = Date.now();
const wavPath = `/tmp/output-${id}.wav`;
const mp3Path = `/tmp/output-${id}.mp3`;

// =========================
// GENERAR WAV CON PIPER
// =========================
execSync(`
echo "${text.replace(/"/g, '\\"')}" | piper \
  --model /opt/models/model.onnx \
  --config /opt/models/model.onnx.json \
  --output_file ${wavPath}
`);

// =========================
// CONVERTIR A MP3
// =========================
execSync(`
ffmpeg -y -i ${wavPath} -codec:a libmp3lame -qscale:a 2 ${mp3Path}
`);

// =========================
// SUBIR A KEY-VALUE STORE
// =========================
const store = await Actor.openKeyValueStore();

const fileBuffer = fs.readFileSync(mp3Path);

const fileName = `audio-${id}.mp3`;

await store.setValue(fileName, fileBuffer, {
    contentType: 'audio/mpeg',
});

// =========================
// URL PUBLICA
// =========================
const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/${fileName}`;

// =========================
// OUTPUT
// =========================
await Actor.setValue('OUTPUT', {
    url,
});

await Actor.exit();
