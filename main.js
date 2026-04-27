import { Actor } from 'apify';
import { execSync } from 'child_process';
import fs from 'fs';

await Actor.init();

const input = await Actor.getInput() || {};
const text = input.text || "Hola, probando la voz MLS optimizada";

const model = "/models/es_ES-mls_10246-low.onnx";
const outputWav = "/tmp/output.wav";
const outputMp3 = "/tmp/output.mp3";

try {
    console.log("🔊 Generando audio con Piper (optimizado)...");

    // 🔥 TEXTO DIRECTO (más rápido, sin escribir archivo)
    const cleanText = text
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    execSync(
        `piper --model ${model} \
        --output_file ${outputWav} \
        --length_scale 1.1 \
        --noise_scale 0.35 \
        --noise_w 0.6 \
        --sentence_silence 0.4`,
        {
            input: cleanText,
            stdio: ['pipe', 'inherit', 'inherit']
        }
    );

    console.log("🎵 Mejorando audio + convirtiendo a MP3...");

    // 🔥 POST-PROCESADO + COMPRESIÓN MÁS RÁPIDA
    execSync(
        `ffmpeg -y -i ${outputWav} \
        -af "dynaudnorm,volume=1.2" \
        -codec:a libmp3lame -qscale:a 5 ${outputMp3}`,
        { stdio: 'inherit' }
    );

    const key = `OUTPUT_MP3_${Date.now()}`;

    await Actor.setValue(key, fs.readFileSync(outputMp3), {
        contentType: 'audio/mpeg',
    });

    const url = `https://api.apify.com/v2/key-value-stores/${Actor.getEnv().defaultKeyValueStoreId}/records/${key}`;

    console.log("✅ MP3 listo:");
    console.log(url);

} catch (err) {
    console.error("❌ Error real:", err);
    throw err;
}

await Actor.exit();
