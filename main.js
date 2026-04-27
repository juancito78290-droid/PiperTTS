import { Actor } from 'apify';
import { execSync } from 'child_process';
import fs from 'fs';

await Actor.init();

const input = await Actor.getInput() || {};
const text = input.text || "Hola, probando la voz MLS correctamente";

const model = "/models/es_ES-mls_10246-low.onnx";
const outputWav = "/tmp/output.wav";
const outputMp3 = "/tmp/output.mp3";

try {
    console.log("🔊 Generando audio con Piper...");

    // Guardar texto
    fs.writeFileSync('/tmp/input.txt', text);

    // Leer texto (evita freeze)
    const textInput = fs.readFileSync('/tmp/input.txt', 'utf-8');

    // 🔥 Piper
    execSync(
        `piper --model ${model} \
        --output_file ${outputWav} \
        --length_scale 0.95 \
        --noise_scale 0.6 \
        --noise_w 0.7 \
        --sentence_silence 0.25`,
        {
            input: textInput,
            stdio: ['pipe', 'inherit', 'inherit']
        }
    );

    console.log("🎵 Convirtiendo a MP3...");

    execSync(
        `ffmpeg -y -i ${outputWav} -codec:a libmp3lame -qscale:a 2 ${outputMp3}`,
        { stdio: 'inherit' }
    );

    // 🔥 OUTPUT ÚNICO
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
