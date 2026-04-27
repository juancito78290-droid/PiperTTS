import { Actor } from 'apify';
import { execSync } from 'child_process';
import fs from 'fs';
import crypto from 'crypto';

await Actor.init();

const input = await Actor.getInput() || {};
let text = input.text || "Texto de prueba optimizado ultra pro";

// =========================
// 🔥 NORMALIZAR TEXTO
// =========================
text = text
    .toLowerCase()
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// 🔥 LIMITADOR ANTI CRASH
if (text.length > 1200) {
    text = text.slice(0, 1200);
}

// =========================
// 🔥 HASH (CACHE)
// =========================
const model = "mls10246";
const hash = crypto.createHash('md5').update(text).digest('hex');
const key = `audio_${model}_${hash}`;

const store = await Actor.openKeyValueStore();

// 🔁 REUTILIZAR SI EXISTE
const existing = await store.getValue(key);

if (existing) {
    const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/${key}`;
    console.log("♻️ CACHE HIT");
    console.log(url);

    await Actor.pushData({ audioUrl: url });
    await Actor.exit();
}

// =========================
// 🔥 CONFIG
// =========================
const modelPath = "/models/es_ES-mls_10246-low.onnx";

const finalWav = "/tmp/output.wav";
const finalMp3 = "/tmp/output.mp3";

// =========================
// 🔥 SPLIT INVISIBLE (ANTI RAM)
// =========================
function splitInvisible(text, max = 140) {
    const parts = [];
    let current = "";
    const words = text.split(" ");

    for (let w of words) {
        if ((current + " " + w).length > max) {
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
    const chunks = splitInvisible(text, 140);
    const wavParts = [];

    // =========================
    // 🔥 GENERAR AUDIO POR PARTES
    // =========================
    for (let i = 0; i < chunks.length; i++) {
        const wav = `/tmp/p_${i}.wav`;

        execSync(
            `piper --model ${modelPath} \
            --output_file ${wav} \
            --length_scale 1.15 \
            --noise_scale 0.3 \
            --noise_w 0.55 \
            --sentence_silence 0.02`,
            {
                input: chunks[i],
                stdio: ['pipe', 'ignore', 'ignore']
            }
        );

        wavParts.push(wav);
    }

    // =========================
    // 🔗 UNIR SIN RECODIFICAR (RÁPIDO)
    // =========================
    const listFile = "/tmp/list.txt";
    fs.writeFileSync(
        listFile,
        wavParts.map(f => `file '${f}'`).join('\n')
    );

    execSync(
        `ffmpeg -y -f concat -safe 0 -i ${listFile} -c copy ${finalWav}`,
        { stdio: 'ignore' }
    );

    // =========================
    // 🎵 CONVERTIR A MP3 (ULTRA LIGHT)
    // =========================
    execSync(
        `ffmpeg -y -i ${finalWav} \
        -af "volume=1.1" \
        -codec:a libmp3lame -qscale:a 7 ${finalMp3}`,
        { stdio: 'ignore' }
    );

    // =========================
    // 💾 GUARDAR (CACHE)
    // =========================
    await store.setValue(key, fs.readFileSync(finalMp3), {
        contentType: 'audio/mpeg',
    });

    const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/${key}`;

    console.log("✅ AUDIO NUEVO:");
    console.log(url);

    await Actor.pushData({ audioUrl: url });

} catch (err) {
    console.error("❌ ERROR:", err);
    throw err;
}

await Actor.exit();
