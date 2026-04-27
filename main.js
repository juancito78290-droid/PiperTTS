import { Actor } from 'apify';
import { spawn } from 'child_process';
import fs from 'fs';

await Actor.init();

const input = await Actor.getInput() || {};
let text = input.text || "Texto rápido optimizado";

// 🔥 limpieza mínima (más rápido)
text = text.replace(/\s+/g, ' ').trim();

// 🔥 store
const store = await Actor.openKeyValueStore();

// 🔥 cache REAL (evita reprocesar)
const existing = await store.getValue('OUTPUT.mp3');
if (existing) {
    const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/OUTPUT.mp3`;
    console.log("♻️ CACHE HIT");
    console.log(url);
    await Actor.exit();
}

const model = "/models/es_ES-mls_10246-low.onnx";
const outputPath = "/tmp/output.mp3";

try {
    console.log("⚡ Generando audio ULTRA rápido...");

    // 🔥 piper ultra simple (menos carga CPU)
    const piper = spawn("/usr/local/bin/piper", [
        "--model", model,
        "--output_file", "-",        // 🔥 stream directo
        "--sentence_silence", "0.0"  // 🔥 sin pausas
    ]);

    // 🔥 ffmpeg ULTRA FAST (casi sin compresión)
    const ffmpeg = spawn("ffmpeg", [
        "-loglevel", "quiet",   // 🔥 evita overhead de logs
        "-f", "s16le",
        "-ar", "22050",
        "-ac", "1",
        "-i", "pipe:0",
        "-acodec", "libmp3lame",
        "-b:a", "32k",          // 🔥 mínimo peso = más rápido
        "-threads", "1",        // 🔥 menos RAM
        outputPath
    ]);

    // 🔥 conectar streams
    piper.stdout.pipe(ffmpeg.stdin);

    piper.stdin.write(text);
    piper.stdin.end();

    // 🔥 manejar errores correctamente (CLAVE)
    await new Promise((resolve, reject) => {
        piper.on('error', reject);
        ffmpeg.on('error', reject);

        ffmpeg.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error("ffmpeg error"));
        });
    });

    // 🔥 guardar SOLO mp3 (sin duplicados)
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
