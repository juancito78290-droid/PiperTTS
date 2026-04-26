import { Actor } from 'apify';
import { execSync } from 'child_process';
import fs from 'fs';

await Actor.init();

const input = await Actor.getInput();
const text = input?.text || "Hola, este es un video viral";

const safeText = text.replace(/"/g, '\\"');

console.log("Generando audio...");

execSync(`
echo "${safeText}" | piper \
--model es_AR.onnx \
--output_file output.wav
`, { stdio: 'inherit' });

execSync(`
ffmpeg -y -i output.wav -codec:a libmp3lame -b:a 128k output.mp3
`, { stdio: 'inherit' });

const buffer = fs.readFileSync('output.mp3');

await Actor.setValue('OUTPUT', buffer, {
    contentType: 'audio/mpeg',
});

await Actor.exit();
