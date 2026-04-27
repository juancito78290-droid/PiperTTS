import { Actor } from 'apify';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

await Actor.init();

const input = await Actor.getInput();
const text = input?.text || "Hola mundo";

// ID único por ejecución
const id = Date.now();
const wavFile = `/tmp/output_${id}.wav`;
const mp3File = `/tmp/output_${id}.mp3`;

// Modelo (ajusta si usas otro)
const model = "/piper/models/es_ES-mls_10246-low.onnx";

// Generar WAV con Piper
execSync(`
echo "${text}" | python3 /piper/piper.py \
  --model ${model} \
  --output_file ${wavFile}
`);

// Convertir a MP3
execSync(`ffmpeg -y -i ${wavFile} ${mp3File}`);

// Leer MP3
const buffer = fs.readFileSync(mp3File);

// Guardar en Key-Value Store
const store = await Actor.openKeyValueStore();
const key = `audio_${id}.mp3`;

await store.setValue(key, buffer, {
    contentType: 'audio/mpeg'
});

// URL pública
const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/${key}?disableRedirect=true`;

console.log("MP3 URL:", url);

// Output final
await Actor.setValue('OUTPUT', { url });

await Actor.exit();
