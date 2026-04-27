const { Actor } = require('apify');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PIPER_BIN  = '/usr/local/bin/piper';
const MODEL_PATH = '/usr/local/piper/voices/es_ES-mls_10246-low.onnx';

function run(cmd, args, options = {}) {
    const result = spawnSync(cmd, args, { ...options, encoding: 'buffer' });
    if (result.status !== 0) {
        const stderr = result.stderr ? result.stderr.toString() : '';
        throw new Error(`Error ejecutando [${cmd}]: ${stderr}`);
    }
    return result;
}

Actor.main(async () => {

    const input = await Actor.getInput();

    const {
        text,
        outputKey    = 'audio',
        speakingRate = 1.0,
        noiseScale   = 0.667,
        noiseW       = 0.8,
    } = input || {};

    if (!text || text.trim() === '') {
        throw new Error('El campo "text" es obligatorio en el input del actor.');
    }

    if (!fs.existsSync(MODEL_PATH)) {
        throw new Error(`Modelo no encontrado en: ${MODEL_PATH}`);
    }

    // Archivos temporales
    const tmpDir  = fs.mkdtempSync(path.join(os.tmpdir(), 'piper-'));
    const wavFile = path.join(tmpDir, 'output.wav');
    const mp3File = path.join(tmpDir, 'output.mp3');

    console.log('🎙️  Generando voz con Piper TTS — es_ES mls_10246...');
    console.log(`   Texto: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);

    try {

        // 1. Generar WAV con Piper
        run(PIPER_BIN, [
            '--model',        MODEL_PATH,
            '--output_file',  wavFile,
            '--noise_scale',  String(noiseScale),
            '--noise_w',      String(noiseW),
            '--length_scale', String(1.0 / speakingRate),
        ], {
            input:   Buffer.from(text, 'utf8'),
            timeout: 120_000,
        });

        if (!fs.existsSync(wavFile)) {
            throw new Error('Piper no generó el archivo WAV.');
        }
        console.log(`✅  WAV generado: ${(fs.statSync(wavFile).size / 1024).toFixed(1)} KB`);

        // 2. Convertir WAV → MP3 con ffmpeg
        console.log('🔄  Convirtiendo WAV → MP3...');
        run('ffmpeg', [
            '-y',
            '-i',        wavFile,
            '-codec:a',  'libmp3lame',
            '-qscale:a', '2',
            '-ar',       '22050',
            mp3File,
        ], { timeout: 60_000 });

        if (!fs.existsSync(mp3File)) {
            throw new Error('ffmpeg no generó el MP3.');
        }
        const mp3Size = fs.statSync(mp3File).size;
        console.log(`✅  MP3 generado: ${(mp3Size / 1024).toFixed(1)} KB`);

        // 3. Subir MP3 al Key-Value Store de Apify
        const kvStore   = await Actor.openKeyValueStore();
        const storeId   = kvStore.id || 'default';
        const recordKey = `${outputKey}.mp3`;

        await kvStore.setValue(recordKey, fs.readFileSync(mp3File), {
            contentType: 'audio/mpeg',
        });
        console.log(`📦  Guardado en KV Store → "${recordKey}"`);

        // 4. URL pública del MP3
        const mp3Url = `https://api.apify.com/v2/key-value-stores/${storeId}/records/${recordKey}`;

        // 5. Output del actor
        await Actor.pushData({
            success      : true,
            mp3Url,
            storeId,
            recordKey,
            model        : 'es_ES-mls_10246-low',
            textLength   : text.length,
            mp3SizeBytes : mp3Size,
            generatedAt  : new Date().toISOString(),
        });

        console.log(`\n🎉  URL del MP3:\n    ${mp3Url}\n`);

    } finally {
        try {
            if (fs.existsSync(wavFile)) fs.unlinkSync(wavFile);
            if (fs.existsSync(mp3File)) fs.unlinkSync(mp3File);
            fs.rmdirSync(tmpDir);
        } catch (_) {}
    }
});
