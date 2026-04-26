import { Actor } from 'apify';
import { execSync } from 'child_process';
import fs from 'fs';

await Actor.init();

const input = await Actor.getInput() || {};
const text = input.text || "Hola, probando la voz Daniela correctamente";

const model = "/models/es_AR-daniela-high.onnx";
const outputWav = "/tmp/output.wav";
const outputMp3 = "/tmp/output.mp3";

try {
    console.log("🔊 Generando audio con Piper...");

    fs.writeFileSync('/tmp/input.txt', text);

    // ✅ FIX CUELGUE + MÁS RÁPIDO
    const textInput = fs.readFileSync('/tmp/input.txt', 'utf-8');

    execSync(
        `piper --model ${model} --output_file ${outputWav} --sentence_silence 0.2`,
        {
            input: textInput,
            stdio: ['pipe', 'inherit', 'inherit']
        }
    );

    console.log("🎵 Convirtiendo a MP3...");

    // 💰 MÁS BARATO (menos calidad pero suficiente)
    execSync(
        `ffmpeg -y -i ${outputWav} -codec:a libmp3lame -qscale:a 5 ${outputMp3}`,
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
