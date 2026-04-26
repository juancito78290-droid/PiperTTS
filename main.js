import { Actor } from 'apify';
import { execSync } from 'child_process';
import fs from 'fs';

await Actor.init();

const input = await Actor.getInput() || {};
const text = input.text || "Hola, esta es la voz argentina Daniela funcionando correctamente";

// Rutas ABSOLUTAS (clave)
const model = "/models/es_AR-daniela-low.onnx";
const outputWav = "/tmp/output.wav";
const outputMp3 = "/tmp/output.mp3";

try {
    console.log("Generando audio con Piper...");

    // Usamos archivo intermedio para evitar problemas con caracteres
    fs.writeFileSync('/tmp/input.txt', text);

    execSync(`cat /tmp/input.txt | piper --model ${model} --output_file ${outputWav}`);

    console.log("Convirtiendo a MP3...");
    execSync(`ffmpeg -y -i ${outputWav} -codec:a libmp3lame -qscale:a 2 ${outputMp3}`);

    // Subir a Apify (esto genera link real)
    await Actor.setValue('OUTPUT_MP3', fs.readFileSync(outputMp3), {
        contentType: 'audio/mpeg',
    });

    const url = `https://api.apify.com/v2/key-value-stores/${Actor.getEnv().defaultKeyValueStoreId}/records/OUTPUT_MP3`;

    console.log("✅ MP3 listo:");
    console.log(url);

} catch (err) {
    console.error("❌ Error ejecutando Piper:", err.message);
    throw err;
}

await Actor.exit();
