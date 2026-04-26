import { Actor } from 'apify';
import { execSync } from 'child_process';
import fs from 'fs';

await Actor.init();

// texto dinámico
const input = await Actor.getInput();
const text = input?.text || "Hola, este es un video viral";

const safeText = text.replace(/"/g, '\\"');

console.log("Generando audio con Piper...");

// generar wav
execSync(`
echo "${safeText}" | piper \
--model es_AR.onnx \
--output_file output.wav
`, { stdio: 'inherit' });

// convertir a mp3
execSync(`
ffmpeg -y -i output.wav -codec:a libmp3lame -b:a 128k output.mp3
`, { stdio: 'inherit' });

// guardar archivo
const buffer = fs.readFileSync('output.mp3');

const key = `audio-${Date.now()}.mp3`;

await Actor.setValue(key, buffer, {
    contentType: 'audio/mpeg',
});

// generar URL
const store = await Actor.openKeyValueStore();
const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/${key}`;

console.log("AUDIO URL:", url);

// devolver al dataset
await Actor.pushData({ audioUrl: url });

await Actor.exit();
