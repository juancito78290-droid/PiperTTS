import { Actor } from 'apify';
import { spawn } from 'child_process';
import fs from 'fs';

await Actor.init();

const input = await Actor.getInput() || {};
let text = input.text || "Texto optimizado rápido";

// 🔥 LIMPIEZA
text = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

// 🔥 STORE
const store = await Actor.openKeyValueStore();

// 🔥 CACHE
const existing = await store.getValue('OUTPUT.mp3');

if (existing) {
    const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/OUTPUT.mp3`;
    console.log("♻️ CACHE HIT");
    console.log(url);
    await Actor.exit();
}

// 🔥 CONFIG
const model = "/models/es_ES-mls_10246-low.onnx";
const outputPath = "/tmp/output.mp3";

try {
    console.log("⚡ Generando audio rápido y estable...");

    // 🔥 PIPER (más seguro)
    const piper = spawn("piper", [
        "--model", model
    ]);

    // 🔥 FFMPEG (rápido + liviano)
    const ffmpeg = spawn("ffmpeg", [
        "-y",
        "-f", "s16le",
        "-ar", "22050",
        "-ac", "1",
        "-i", "pipe:0",
        "-acodec", "libmp3lame",
        "-b:a", "48k", // 🔥 balance velocidad/calidad
        outputPath
    ]);

    // 🔗 PIPE
    piper.stdout.pipe(ffmpeg.stdin);

    // 🔥 TEXTO A PIPER
    piper.stdin.write(text);
    piper.stdin.end();

    // 🔥 CONTROL DE ERRORES REAL (CLAVE)
    await new Promise((resolve, reject) => {
        piper.on('close', (code) => {
            if (code !== 0) reject(new Error("piper error"));
        });

        ffmpeg.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error("ffmpeg error"));
        });
    });

    // 💾 GUARDAR
    await store.setValue('OUTPUT.mp3', fs.readFileSync(outputPath), {
        contentType: 'audio/mpeg',
    });

    const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/OUTPUT.mp3`;

    console.log("✅ AUDIO LISTO:");
    console.log(url);

} catch (err) {
    console.error("❌ ERROR:", err);
    throw err;
}

await Actor.exit();
