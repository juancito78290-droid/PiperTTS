import { Actor } from 'apify';
import { execSync } from 'child_process';
import fs from 'fs';

await Actor.init();

const input = await Actor.getInput() || {};
let text = input.text || "Hola, esta es una prueba sin pausas";

// limpieza ligera
text = text
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const model = "/models/es_ES-mls_10246-low.onnx";

const outputWav = "/tmp/output.wav";
const outputMp3 = "/tmp/output.mp3";

try {
    console.log("⚡ Generando audio sin pausas...");

    execSync(
        `piper --model ${model} \
        --output_file ${outputWav} \
        --length_scale 1.08 \
        --noise_scale 0.32 \
        --noise_w 0.58 \
        --sentence_silence 0.05`,
        {
            input: text,
            stdio: ['pipe', 'ignore', 'ignore']
        }
    );

    console.log("🎚️ Limpiando silencios + mejorando audio...");

    execSync(
        `ffmpeg -y -i ${outputWav} \
        -af "silenceremove=1:0:-50dB,highpass=f=80,lowpass=f=12000,dynaudnorm,volume=1.1" \
        -codec:a libmp3lame -qscale:a 6 ${outputMp3}`,
        { stdio: 'ignore' }
    );

    const key = `OUTPUT_MP3_${Date.now()}`;

    await Actor.setValue(key, fs.readFileSync(outputMp3), {
        contentType: 'audio/mpeg',
    });

    const url = `https://api.apify.com/v2/key-value-stores/${Actor.getEnv().defaultKeyValueStoreId}/records/${key}`;

    console.log("✅ AUDIO LISTO:");
    console.log(url);

} catch (err) {
    console.error("❌ Error:", err);
    throw err;
}

await Actor.exit();
