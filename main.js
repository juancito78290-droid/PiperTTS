import { Actor } from 'apify';
import { execSync } from 'child_process';
import fs from 'fs';

await Actor.init();

// INPUT
const input = await Actor.getInput() || {};
const text = input.text || "Hola, esta es una voz argentina generada con Piper";

// Modelo argentino
const model = "es_AR-mls_10246-low.onnx";
const modelJson = model + ".json";

const outputWav = "output.wav";
const outputMp3 = "output.mp3";

// Descargar modelo si no existe
if (!fs.existsSync(model)) {
    console.log("Descargando modelo argentino...");

    execSync(`wget https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/mls_10246/low/${model}`);
    execSync(`wget https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/mls_10246/low/${modelJson}`);
}

// Generar audio WAV con Piper
console.log("Generando audio WAV...");
execSync(`echo "${text.replace(/"/g, '\\"')}" | piper --model ${model} --output_file ${outputWav}`);

// Convertir a MP3 con FFmpeg
console.log("Convirtiendo a MP3...");
execSync(`ffmpeg -y -i ${outputWav} -vn -ar 44100 -ac 2 -b:a 192k ${outputMp3}`);

// Guardar en Apify
await Actor.setValue('OUTPUT_AUDIO_MP3', fs.readFileSync(outputMp3), {
    contentType: 'audio/mpeg',
});

console.log("MP3 generado correctamente");

await Actor.exit();
