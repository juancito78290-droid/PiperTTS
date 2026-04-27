import { Actor } from 'apify';
import { execSync } from 'child_process';
import fs from 'fs';

await Actor.init();

const input = await Actor.getInput() || {};
let text = input.text || "Texto largo de prueba optimizado";

// 🔥 limpieza ligera
text = text
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const model = "/models/es_ES-mls_10246-low.onnx";

const finalWav = "/tmp/output.wav";
const finalMp3 = "/tmp/output.mp3";

// 🔥 dividir SIN que se note (clave)
function splitInvisible(text, max = 180) {
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
    console.log("⚡ Modo invisible activado...");

    const chunks = splitInvisible(text, 180);
    const wavParts = [];

    for (let i = 0; i < chunks.length; i++) {
        const part = chunks[i];
        const wav = `/tmp/part_${i}.wav`;

        execSync(
            `piper --model ${model} \
            --output_file ${wav} \
            --length_scale 1.08 \
            --noise_scale 0.32 \
            --noise_w 0.58 \
            --sentence_silence 0.03`,
            {
                input: part,
                stdio: ['pipe', 'ignore', 'ignore']
            }
        );

        wavParts.push(wav);
    }

    console.log("🔗 Uniendo audio (sin cortes)...");

    const listFile = "/tmp/list.txt";
    fs.writeFileSync(
        listFile,
        wavParts.map(f => `file '${f}'`).join('\n')
    );

    execSync(
        `ffmpeg -y -f concat -safe 0 -i ${listFile} -c copy ${finalWav}`,
        { stdio: 'ignore' }
    );

    console.log("🎚️ Post-procesando...");

    execSync(
        `ffmpeg -y -i ${finalWav} \
        -af "silenceremove=1:0:-50dB,highpass=f=80,lowpass=f=12000,dynaudnorm,volume=1.1" \
        -codec:a libmp3lame -qscale:a 6 ${finalMp3}`,
        { stdio: 'ignore' }
    );

    const key = `OUTPUT_MP3_${Date.now()}`;

    await Actor.setValue(key, fs.readFileSync(finalMp3), {
        contentType: 'audio/mpeg',
    });

    const url = `https://api.apify.com/v2/key-value-stores/${Actor.getEnv().defaultKeyValueStoreId}/records/${key}`;

    console.log("✅ AUDIO FINAL:");
    console.log(url);

} catch (err) {
    console.error("❌ Error:", err);
    throw err;
}

await Actor.exit();
