import { Actor } from 'apify';
import { execSync } from 'child_process';
import fs from 'fs';

await Actor.init();

const input = await Actor.getInput() || {};
const text = input.text || "Hola, probando la voz Daniela correctamente";

// 🔥 MODELO LOW (CLAVE)
const model = "/models/es_AR-daniela-low.onnx";

const outputWav = "/tmp/output.wav";
const outputMp3 = "/tmp/output.mp3";

try {
    console.log("🔊 Generando audio con Piper...");

    fs.writeFileSync('/tmp/input.txt', text);

    // ✅ FIX CUELGUE (stdin correcto)
    const textInput = fs.readFileSync('/tmp/input.txt', 'utf-8');

    execSync(
        `piper --model ${model} --output_file ${outputWav} --sentence_silence 0.15`,
        {
            input: textInput,
            stdio: ['pipe', 'inherit', 'inherit']
        }
    );

    console.log("🎵 Convirtiendo a MP3...");

    // 💰 MÁS BARATO
    execSync(
        `ffmpeg -y -i ${outputWav} -codec:a libmp3lame -qscale:a 6 ${outputMp3}`,
        { stdio: 'inherit' }
    );

    // 🔥 OUTPUT ÚNICO (IMPORTANTE PARA PARALELO)
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
