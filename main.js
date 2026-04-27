import { Actor } from 'apify';
import fs from 'fs';
import { execSync } from 'child_process';

await Actor.init();

const input = await Actor.getInput();

const text = input.text || "Hola, esto es una prueba";
const outputName = `audio_${Date.now()}`;

const wavPath = `/tmp/${outputName}.wav`;
const mp3Path = `/tmp/${outputName}.mp3`;

try {
    // =========================
    // GENERAR WAV CON PIPER
    // =========================
    execSync(`echo "${text}" | piper \
        --model /opt/models/model.onnx \
        --output_file ${wavPath}`);

    // =========================
    // CONVERTIR A MP3
    // =========================
    execSync(`ffmpeg -y -i ${wavPath} -codec:a libmp3lame -qscale:a 2 ${mp3Path}`);

    // =========================
    // GUARDAR EN KEY-VALUE STORE
    // =========================
    const store = await Actor.openKeyValueStore();

    const fileBuffer = fs.readFileSync(mp3Path);

    await store.setValue(`${outputName}.mp3`, fileBuffer, {
        contentType: 'audio/mpeg'
    });

    const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/${outputName}.mp3`;

    // =========================
    // OUTPUT FINAL
    // =========================
    await Actor.pushData({
        status: "success",
        url: url
    });

} catch (error) {
    console.error(error);

    await Actor.pushData({
        status: "error",
        error: error.message
    });
}

await Actor.exit();
