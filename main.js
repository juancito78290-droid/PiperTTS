import { Actor } from 'apify';
import fs from 'fs';
import { execSync } from 'child_process';

await Actor.init();

// =========================
// INPUT
// =========================
const input = await Actor.getInput();
const text = input?.text || "Hola, este es un audio generado con Piper TTS.";

// Archivos
const wavFile = "output.wav";
const mp3File = "output.mp3";

// =========================
// GENERAR WAV (PIPER)
// =========================
console.log("🔊 Generando WAV...");

execSync(`
    echo "${text.replace(/"/g, '\\"')}" | piper \
    --model /opt/models/model.onnx \
    --config /opt/models/model.onnx.json \
    --output_file ${wavFile}
`, { stdio: "inherit" });

// =========================
// CONVERTIR A MP3 (FFMPEG)
// =========================
console.log("🎵 Convirtiendo a MP3...");

execSync(`
    ffmpeg -y -i ${wavFile} -codec:a libmp3lame -qscale:a 2 ${mp3File}
`, { stdio: "inherit" });

// =========================
// SUBIR A KV STORE
// =========================
console.log("☁️ Subiendo a KV Store...");

const store = await Actor.openKeyValueStore();

const buffer = fs.readFileSync(mp3File);

await store.setValue("audio.mp3", buffer, {
    contentType: "audio/mpeg",
});

// =========================
// URL PÚBLICA
// =========================
const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/audio.mp3?disableRedirect=true`;

console.log("✅ URL:", url);

// =========================
// OUTPUT FINAL
// =========================
await Actor.pushData({
    url,
});

await Actor.exit();
