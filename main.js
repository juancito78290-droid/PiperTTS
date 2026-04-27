import { Actor } from 'apify';
import { execSync } from 'child_process';
import fs from 'fs';

await Actor.init();

const input = await Actor.getInput();
const text = input?.text || "Hola mundo desde Piper";

const wavPath = '/tmp/output.wav';
const mp3Path = '/tmp/output.mp3';

// ⚠️ Usa un modelo real descargado
const modelPath = '/piper/es_ES-mls_10246-low.onnx';

// 1. Generar WAV con Piper
execSync(`
echo "${text}" | /piper/piper \
  --model ${modelPath} \
  --output_file ${wavPath}
`);

// 2. Convertir a MP3
execSync(`
ffmpeg -y -i ${wavPath} -codec:a libmp3lame -qscale:a 2 ${mp3Path}
`);

// 3. Subir a key-value store
const store = await Actor.openKeyValueStore();
await store.setValue('output.mp3', fs.readFileSync(mp3Path), {
    contentType: 'audio/mpeg',
});

// 4. URL pública
const url = store.getPublicUrl('output.mp3');

await Actor.setValue('OUTPUT', {
    url,
});

await Actor.exit();
