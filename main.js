import { Actor } from 'apify';
import { execSync } from 'child_process';
import fs from 'fs';

await Actor.init();

const input = await Actor.getInput() || {};
const text = input.text || "Hola, este es un ejemplo con voz argentina";

// Archivos
const model = "es_AR-daniela-high.onnx";
const config = "es_AR-daniela-high.onnx.json";

const outputWav = "output.wav";
const outputMp3 = "output.mp3";

// URLs reales (FUNCIONAN)
const baseUrl = "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high";

// Descargar modelo si no existe
if (!fs.existsSync(model)) {
    console.log("Descargando modelo argentino (daniela)...");
    execSync(`wget ${baseUrl}/${model}`);
    execSync(`wget ${baseUrl}/${config}`);
}

// Generar WAV con Piper
console.log("Generando audio...");
execSync(`echo "${text}" | piper --model ${model} --config ${config} --output_file ${outputWav}`);

// Convertir a MP3
console.log("Convirtiendo a MP3...");
execSync(`ffmpeg -y -i ${outputWav} -codec:a libmp3lame -qscale:a 2 ${outputMp3}`);

// Subir a Apify (esto genera link)
await Actor.setValue('OUTPUT_MP3', fs.readFileSync(outputMp3), {
    contentType: 'audio/mpeg',
});

// Generar URL pública
const url = `https://api.apify.com/v2/key-value-stores/${Actor.getEnv().defaultKeyValueStoreId}/records/OUTPUT_MP3`;

console.log("✅ MP3 listo:");
console.log(url);

await Actor.exit();
