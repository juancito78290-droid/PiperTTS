import { Actor } from 'apify';
import { spawn } from 'child_process';
import fs from 'fs';

await Actor.init();

const input = await Actor.getInput();

if (!input?.text) {
    throw new Error("Debes enviar { text: '...' }");
}

const text = input.text;

const id = Date.now();
const wavPath = `/tmp/audio-${id}.wav`;
const mp3Path = `/tmp/audio-${id}.mp3`;

console.log("🎤 Piper...");

// ---- PIPER ----
await new Promise((resolve, reject) => {
    const piper = spawn('/usr/local/bin/piper', [
        '--model', '/models/model.onnx',
        '--output_file', wavPath
    ]);

    let err = '';

    piper.stdin.write(text);
    piper.stdin.end();

    piper.stderr.on('data', d => err += d.toString());

    piper.on('close', code => {
        if (code !== 0) return reject(new Error(err));
        resolve();
    });

    piper.on('error', reject);
});

console.log("🎧 FFmpeg...");

// ---- WAV → MP3 ----
await new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
        '-y',
        '-i', wavPath,
        '-vn',
        '-ar', '44100',
        '-ac', '2',
        '-b:a', '192k',
        mp3Path
    ]);

    let err = '';

    ffmpeg.stderr.on('data', d => err += d.toString());

    ffmpeg.on('close', code => {
        if (code !== 0) return reject(new Error(err));
        resolve();
    });

    ffmpeg.on('error', reject);
});

console.log("☁️ Subiendo...");

const store = await Actor.openKeyValueStore();

const buffer = fs.readFileSync(mp3Path);
const key = `audio-${id}.mp3`;

await store.setValue(key, buffer, {
    contentType: 'audio/mpeg',
});

const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/${key}?disableRedirect=true`;

console.log("✅ MP3:", url);

await Actor.setOutput({
    url,
    key,
    size: buffer.length
});

// limpiar
try {
    fs.unlinkSync(wavPath);
    fs.unlinkSync(mp3Path);
} catch {}

await Actor.exit();
