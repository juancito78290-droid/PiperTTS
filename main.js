import { Actor } from 'apify';
import { spawn } from 'child_process';
import fs from 'fs';

await Actor.init();

const input = await Actor.getInput() || {};
let text = input.text || "Texto rápido optimizado";

// Limpieza rápida
text = text.replace(/\s+/g, ' ').trim();

const store = await Actor.openKeyValueStore();

// CACHE
const existing = await store.getValue('OUTPUT.mp3');
if (existing) {
    const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/OUTPUT.mp3`;
    console.log("♻️ CACHE HIT");
    console.log(url);
    await Actor.exit();
}

// Rutas
const model = "/models/model.onnx";
const outputPath = "/tmp/output.mp3";

try {
    console.log("⚡ Generando audio...");

    const piper = spawn("/usr/local/bin/piper", [
        "--model", model,
        "--output_file", "-", 
        "--sentence_silence", "0.0"
    ]);

    const ffmpeg = spawn("ffmpeg", [
        "-y",
        "-f", "s16le",
        "-ar", "22050",
        "-ac", "1",
        "-i", "pipe:0",
        "-acodec", "libmp3lame",
        "-b:a", "64k",
        outputPath
    ]);

    // ERRORES VISIBLES
    piper.stderr.on('data', d => console.error("PIPER:", d.toString()));
    ffmpeg.stderr.on('data', d => console.error("FFMPEG:", d.toString()));

    // PIPE
    piper.stdout.pipe(ffmpeg.stdin);

    // INPUT
    piper.stdin.write(text);
    piper.stdin.end();

    // Esperar ambos procesos correctamente
    await Promise.all([
        new Promise((res, rej) => {
            piper.on('close', code => {
                if (code !== 0) rej(new Error("Piper falló"));
                else res();
            });
            piper.on('error', rej);
        }),
        new Promise((res, rej) => {
            ffmpeg.on('close', code => {
                if (code !== 0) rej(new Error("FFmpeg falló"));
                else res();
            });
            ffmpeg.on('error', rej);
        })
    ]);

    // Verificar archivo
    if (!fs.existsSync(outputPath)) {
        throw new Error("No se generó el audio");
    }

    const buffer = fs.readFileSync(outputPath);

    await store.setValue('OUTPUT.mp3', buffer, {
        contentType: 'audio/mpeg',
    });

    const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/OUTPUT.mp3`;

    console.log("✅ AUDIO LISTO:");
    console.log(url);

} catch (err) {
    console.error("❌ ERROR REAL:", err);
    throw err;
}

await Actor.exit();
