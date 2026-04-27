import { Actor } from 'apify';
import { spawn } from 'child_process';
import fs from 'fs';

await Actor.init();

const input = await Actor.getInput() || {};
let text = input.text || "Texto rápido optimizado";

text = text.replace(/\s+/g, ' ').trim();

const store = await Actor.openKeyValueStore();

const existing = await store.getValue('OUTPUT.mp3');
if (existing) {
    const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/OUTPUT.mp3`;
    console.log("♻️ CACHE HIT");
    console.log(url);
    await Actor.exit();
}

const model = "/models/model.onnx";
const outputPath = "/tmp/output.mp3";

try {
    console.log("⚡ Generando audio...");

    const piper = spawn("piper", [
        "--model", model,
        "--output_file", "/tmp/output.wav",
        "--sentence_silence", "0.0"
    ]);

    piper.stdin.write(text);
    piper.stdin.end();

    await new Promise((resolve, reject) => {
        piper.on('error', reject);
        piper.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error("Piper error"));
        });
    });

    const ffmpeg = spawn("ffmpeg", [
        "-y",
        "-loglevel", "error",
        "-i", "/tmp/output.wav",
        "-acodec", "libmp3lame",
        "-b:a", "32k",
        outputPath
    ]);

    await new Promise((resolve, reject) => {
        ffmpeg.on('error', reject);
        ffmpeg.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error("ffmpeg error"));
        });
    });

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
