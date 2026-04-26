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

    // 🔍 DEBUG
    console.log("🔍 Verificando piper...");
    try { execSync("which piper", { stdio: 'inherit' }); } catch {}
    console.log("📂 Verificando modelos...");
    try { execSync("ls -lah /models", { stdio: 'inherit' }); } catch {}

    fs.writeFileSync('/tmp/input.txt', text);

    console.log("🚀 Ejecutando Piper...");

    // ⏱️ TIMEOUT para evitar que se quede colgado
    execSync(
        `piper --model ${model} --output_file ${outputWav} < /tmp/input.txt`,
        { stdio: 'inherit', timeout: 120000 } // 2 minutos máx
    );

    console.log("✅ Piper terminó");

    console.log("🎵 Convirtiendo a MP3...");

    execSync(
        `ffmpeg -y -i ${outputWav} -codec:a libmp3lame -qscale:a 2 ${outputMp3}`,
        { stdio: 'inherit', timeout: 60000 }
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
