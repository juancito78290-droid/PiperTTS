import { Actor } from 'apify';
import { execSync } from 'child_process';
import fs from 'fs';
import crypto from 'crypto';

await Actor.init();

const input = await Actor.getInput() || {};
let text = input.text || "Texto de prueba optimizado";

// =========================
// 🔥 LIMPIEZA (CLAVE)
// =========================
text = text
.replace(/\n/g, ' ')
.replace(/\s+/g, ' ')
.trim();

// =========================
// 🔥 CACHE (AHORRO TOTAL)
// =========================
const store = await Actor.openKeyValueStore();

const hash = crypto.createHash('md5').update(text).digest('hex');
const key = `${hash}.mp3`;

const existing = await store.getValue('OUTPUT');

if (existing) {
    const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/OUTPUT`;
    console.log("♻️ CACHE HIT");
    console.log(url);

    await Actor.setValue('OUTPUT', { audioUrl: url });
    await Actor.exit();
}

// =========================
// 🔥 CONFIG
// =========================
const model = "/models/es_ES-mls_10246-low.onnx";
const finalWav = "/tmp/output.wav";
const finalMp3 = "/tmp/output.mp3";

// =========================
// 🔥 SPLIT ANTI RAM
// =========================
function splitText(text, maxLen = 130) {
    const words = text.split(" ");
    const parts = [];
    let current = "";

    for (let w of words) {
        if ((current + " " + w).length > maxLen) {
            parts.push(current.trim());
            current = w;
        } else {
            current += " " + w;
        }
    }

    if (current) parts.push(current.trim());
    return parts;
}

try {
    // 🔥 SOLO SPLIT SI ES NECESARIO
    const parts = text.length < 180 ? [text] : splitText(text, 130);

    const wavFiles = [];

    for (let i = 0; i < parts.length; i++) {
        const wav = `/tmp/p_${i}.wav`;

        execSync(
            `piper --model ${model} \
--output_file ${wav} \
--length_scale 1.0 \
--noise_scale 0.3 \
--noise_w 0.5 \
--sentence_silence 0.0`,
            {
                input: parts[i],
                stdio: ['pipe', 'ignore', 'ignore']
            }
        );

        wavFiles.push(wav);
    }

    const listFile = "/tmp/list.txt";
    fs.writeFileSync(
        listFile,
        wavFiles.map(f => `file '${f}'`).join('\n')
    );

    execSync(
        `ffmpeg -y -f concat -safe 0 -i ${listFile} -c copy ${finalWav}`,
        { stdio: 'ignore' }
    );

    // 🔥 MP3 MÁS RÁPIDO
    execSync(
        `ffmpeg -y -i ${finalWav} -acodec libmp3lame -b:a 96k ${finalMp3}`,
        { stdio: 'ignore' }
    );

    // =========================
    // 💾 SOLO OUTPUT
    // =========================
    await store.setValue('OUTPUT', fs.readFileSync(finalMp3), {
        contentType: 'audio/mpeg',
    });

    const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/OUTPUT`;

    console.log("✅ AUDIO LISTO:");
    console.log(url);

    await Actor.setValue('OUTPUT', { audioUrl: url });

} catch (err) {
    console.error("❌ ERROR:", err);
    throw err;
}

await Actor.exit();
