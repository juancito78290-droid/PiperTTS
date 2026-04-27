import { Actor } from 'apify';
import { spawn } from 'child_process';
import fs from 'fs';

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

// 🔥 CONFIG (MLS 10246 LOW)
const model = "/models/es_ES-mls_10246-low.onnx";
const tempWav = "/tmp/temp.wav";
const outputMp3 = "/tmp/output.mp3";

try {
    console.log("⚡ Generando audio rápido y estable...");

    // =========================
    // 🔊 PIPER (estable)
    // =========================
    await new Promise((resolve, reject) => {
        const piper = spawn("piper", [
            "--model", model,
            "--output_file", tempWav,
            "--length_scale", "1.08",
            "--noise_scale", "0.35",
            "--noise_w", "0.6",
            "--sentence_silence", "0.0"
        ]);

        piper.stdin.write(text);
        piper.stdin.end();

        piper.on('close', code => {
            if (code === 0) resolve();
            else reject(new Error("piper error"));
        });
    });

    // =========================
    // 🎵 FFmpeg (rápido)
    // =========================
    await new Promise((resolve, reject) => {
        const ffmpeg = spawn("ffmpeg", [
            "-y",
            "-i", tempWav,
            "-acodec", "libmp3lame",
            "-b:a", "64k", // 🔥 balance calidad/velocidad
            outputMp3
        ]);

        ffmpeg.on('close', code => {
            if (code === 0) resolve();
            else reject(new Error("ffmpeg error"));
        });
    });

    // =========================
    // 💾 GUARDAR
    // =========================
    await store.setValue('OUTPUT.mp3', fs.readFileSync(outputMp3), {
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
