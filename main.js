import { Actor } from 'apify';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

await Actor.init();

const input = await Actor.getInput();

const text = input?.text || "Hola, esto es una prueba de voz con Piper.";

const WAV_PATH = '/tmp/output.wav';
const MP3_PATH = '/tmp/output.mp3';

try {
    // Validar binario
    if (!fs.existsSync(process.env.PIPER_BIN)) {
        throw new Error('Piper no encontrado en ' + process.env.PIPER_BIN);
    }

    // Generar WAV
    execFileSync(process.env.PIPER_BIN, [
        '--model', process.env.MODEL_PATH,
        '--output_file', WAV_PATH
    ], {
        input: text,
        stdio: ['pipe', 'ignore', 'pipe'],
        maxBuffer: 10 * 1024 * 1024
    });

    // Validar WAV
    if (!fs.existsSync(WAV_PATH)) {
        throw new Error('No se generó el WAV');
    }

    // Convertir a MP3 (optimizado)
    execFileSync('ffmpeg', [
        '-y',
        '-i', WAV_PATH,
        '-vn',
        '-ar', '44100',
        '-ac', '2',
        '-b:a', '128k',
        MP3_PATH
    ], {
        stdio: 'ignore'
    });

    if (!fs.existsSync(MP3_PATH)) {
        throw new Error('No se generó el MP3');
    }

    // Guardar en KV Store (esto crea URL pública)
    const buffer = fs.readFileSync(MP3_PATH);

    await Actor.setValue('output.mp3', buffer, {
        contentType: 'audio/mpeg'
    });

    const run = await Actor.getEnv();

    const url = `https://api.apify.com/v2/key-value-stores/${run.defaultKeyValueStoreId}/records/output.mp3`;

    console.log('✅ MP3 URL:', url);

    await Actor.setValue('OUTPUT', { url });

} catch (err) {
    console.error('❌ ERROR:', err.message);
    throw err;
}

await Actor.exit();
