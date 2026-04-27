import { Actor } from 'apify';
import { execSync } from 'child_process';
import fs from 'fs';
import crypto from 'crypto';

await Actor.init();

const input = await Actor.getInput() || {};
let text = input.text || "Hola probando la voz Daniela alta calidad";

// 🔥 LIMPIEZA
text = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

// 🔥 STORE
const store = await Actor.openKeyValueStore();

const hash = crypto.createHash('md5').update(text).digest('hex');

// 🔥 MODELO DANIELA
const model = "/models/es_AR-daniela-high.onnx";

const finalWav = "/tmp/output.wav";
const finalMp3 = "/tmp/output.mp3";

// 🔥 SPLIT OBLIGATORIO (HIGH = pesado)
function splitText(text, maxLen = 100) {
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
    const parts = splitText(text, 100);
    const wavFiles = [];

    for (let i = 0; i < parts.length; i++) {
        const wav = `/tmp/p_${i}.wav`;

        execSync(
            `piper --model ${model} \
--output_file ${wav} \
--length_scale 1.05 \
--noise_scale 0.25 \
--noise_w 0.4 \
--sentence_silence 0.05`,
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

    execSync(
        `ffmpeg -y -i ${finalWav} -acodec libmp3lame -b:a 96k ${finalMp3}`,
        { stdio: 'ignore' }
    );

    await store.setValue('OUTPUT.mp3', fs.readFileSync(finalMp3), {
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
