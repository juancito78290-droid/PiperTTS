import { Actor } from 'apify';
import { spawn } from 'child_process';
import fs from 'fs';

await Actor.init();

const input = await Actor.getInput() || {};
let text = input.text || "Texto optimizado ultra rápido";

// 🔥 LIMPIEZA
text = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

const store = await Actor.openKeyValueStore();

const model = "/models/es_AR-daniela-high.onnx";
const outputPath = "/tmp/output.mp3";

try {
    console.log("⚡ Generando audio ultra rápido...");

    const piper = spawn("piper", [
        "--model", model,
        "--output_file", "-",
        "--length_scale", "1.2",
        "--noise_scale", "0.15",
        "--noise_w", "0.2",
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

    piper.stdout.pipe(ffmpeg.stdin);

    piper.stdin.write(text);
    piper.stdin.end();

    await new Promise((resolve, reject) => {
        ffmpeg.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error("ffmpeg error"));
        });
    });

    await store.setValue('OUTPUT.mp3', fs.createReadStream(outputPath), {
        contentType: 'audio/mpeg',
    });

    const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/OUTPUT.mp3?disableRedirect=false`;

    console.log("✅ AUDIO LISTO:");
    console.log(url);

} catch (err) {
    console.error("❌ ERROR:", err);
    throw err;
}

await Actor.exit();
