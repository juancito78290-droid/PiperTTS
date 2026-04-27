import { Actor } from 'apify';
import { execSync } from 'child_process';
import fs from 'fs';

await Actor.init();

const input = await Actor.getInput();
const text = (input?.text || "Hola mundo desde Piper").replace(/"/g, '');

const wavPath = '/tmp/output.wav';
const mp3Path = '/tmp/output.mp3';

// Generar audio con Piper
execSync(`
echo "${text}" | /opt/piper/piper \
--model /models/model.onnx \
--config /models/model.onnx.json \
--output_file ${wavPath}
`);

// Convertir a MP3
execSync(`ffmpeg -y -i ${wavPath} ${mp3Path}`);

// Guardar en KV
const store = await Actor.openKeyValueStore();
const key = `audio-${Date.now()}.mp3`;

await store.setValue(key, fs.readFileSync(mp3Path), {
    contentType: 'audio/mpeg',
});

// URL directa
const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/${key}`;

await Actor.setOutput({ url });

await Actor.exit();
