import { Actor } from 'apify';
import { execSync } from 'child_process';
import fs from 'fs';

await Actor.init();

const input = await Actor.getInput();
const text = input?.text || "Hola, esto es una prueba con Piper TTS";

// Rutas
const MODEL_DIR = "/tmp/piper";
const MODEL_PATH = `${MODEL_DIR}/model.onnx`;
const CONFIG_PATH = `${MODEL_DIR}/model.onnx.json`;

const WAV_PATH = "/tmp/output.wav";
const MP3_PATH = "/tmp/output.mp3";

// Crear carpeta
if (!fs.existsSync(MODEL_DIR)) {
    fs.mkdirSync(MODEL_DIR, { recursive: true });
}

// Descargar modelo (solo una vez)
if (!fs.existsSync(MODEL_PATH)) {
    console.log("Descargando modelo Piper...");

    execSync(`
        wget -O ${MODEL_PATH} https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/carlfm/medium/es_ES-carlfm-medium.onnx
    `);

    execSync(`
        wget -O ${CONFIG_PATH} https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/carlfm/medium/es_ES-carlfm-medium.onnx.json
    `);
}

// Generar WAV con Piper
console.log("Generando WAV...");
execSync(`
    echo "${text.replace(/"/g, '\\"')}" | piper \
    --model ${MODEL_PATH} \
    --config ${CONFIG_PATH} \
    --output_file ${WAV_PATH}
`);

// Convertir a MP3
console.log("Convirtiendo a MP3...");
execSync(`
    ffmpeg -y -i ${WAV_PATH} -codec:a libmp3lame -qscale:a 2 ${MP3_PATH}
`);

// Validar
if (!fs.existsSync(MP3_PATH)) {
    throw new Error("No se generó el MP3");
}

// Guardar en KV Store
const store = await Actor.openKeyValueStore();
const buffer = fs.readFileSync(MP3_PATH);

const fileName = `audio-${Date.now()}.mp3`;

await store.setValue(fileName, buffer, {
    contentType: 'audio/mpeg',
});

// Generar URL pública
const url = `https://api.apify.com/v2/key-value-stores/${store.id}/records/${fileName}?disableRedirect=true`;

await Actor.pushData({
    status: "ok",
    text,
    mp3_url: url
});

console.log("MP3 listo:", url);

await Actor.exit();
