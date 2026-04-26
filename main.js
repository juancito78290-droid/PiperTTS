import { Actor } from 'apify';
import { execSync } from 'child_process';
import fs from 'fs';

await Actor.init();

const input = await Actor.getInput();
const text = input?.text || "Hola, este es un video viral";

// evitar errores en shell
const safeText = text.replace(/"/g, '\\"');

console.log("Generando audio con Piper...");

// 1. WAV con Piper
execSync(`
echo "${safeText}" | piper \
--model es_AR.onnx \
--output_file output.wav
`, { stdio: 'inherit' });

// 2. WAV → MP3
execSync(`
ffmpeg -y -i output.wav -codec:a libmp3lame -b:a 128k output.mp3
`, { stdio: 'inherit' });

// 3. guardar en Apify
const buffer = fs.readFileSync('output.mp3');
const key = `audio-${Date.now()}.mp3`;

await Actor.setValue(key, buffer, {
    contentType: 'audio/mpeg',
});

// 4. generar URL
const store = await Actor.openKeyValueStore();
const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/${key}`;

console.log("AUDIO URL:", url);

// 5. devolver resultado
await Actor.pushData({ audioUrl: url });

await Actor.exit();
