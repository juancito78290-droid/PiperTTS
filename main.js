import { Actor } from 'apify';
import { spawn } from 'child_process';
import fs from 'fs';
import crypto from 'crypto';

await Actor.init();

const input = await Actor.getInput() || {};
let text = input.text || "Texto optimizado ultra rápido";

// 🔥 LIMPIEZA
text = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

// 🔥 STORE
const store = await Actor.openKeyValueStore();

// 🔥 CACHE
const existing = await store.getValue('OUTPUT.mp3');

if (existing) {
    const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/OUTPUT.mp3?disableRedirect=true`;
    console.log("♻️ CACHE HIT");
    console.log(url);
    await Actor.exit();
}

// 🔥 CONFIG
const model = "/models/es_AR-daniela-high.onnx";
const tempWav = "/tmp/temp.wav";
const outputPath = "/tmp/output.mp3";

try {
    console.log("⚡ Generando audio...");

    // =========================
    // 🔊 GENERAR WAV (FIX CLAVE)
    // =========================
    await new Promise((resolve, reject) => {
        const piper = spawn("piper", [
            "--model", model,
            "--output_file", tempWav,
            "--length_scale", "1.15",
            "--noise_scale", "0.2",
            "--noise_w", "0.3",
            "--sentence_silence", "0.0"
        ]);

        piper.stdin.write(text);
        piper.stdin.end();

        piper.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error("piper error"));
        });
    });

    // =========================
    // 🎵 CONVERTIR A MP3
    // =========================
    await new Promise((resolve, reject) => {
        const ffmpeg = spawn("ffmpeg", [
            "-y",
            "-i", tempWav,
            "-acodec", "libmp3lame",
            "-b:a", "96k",
            outputPath
        ]);

        ffmpeg.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error("ffmpeg error"));
        });
    });

    // =========================
    // 💾 GUARDAR
    // =========================
    await store.setValue('OUTPUT.mp3', fs.readFileSync(outputPath), {
        contentType: 'audio/mpeg',
    });

    const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/OUTPUT.mp3?disableRedirect=true`;

    console.log("✅ AUDIO LISTO:");
    console.log(url);

} catch (err) {
    console.error("❌ ERROR:", err);
    throw err;
}

await Actor.exit();
