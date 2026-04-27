const { Actor } = require('apify');
const { spawnSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const PIPER_BIN  = '/usr/local/bin/piper';
const MODEL_PATH = '/usr/local/piper/voices/es_ES-mls_10246-low.onnx';

function run(cmd, args, opts = {}) {
    const result = spawnSync(cmd, args, {
        timeout: 120_000,
        ...opts,
        encoding: 'buffer',
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
        const msg = result.stderr ? result.stderr.toString().trim() : 'sin stderr';
        throw new Error(`[${cmd}] código ${result.status}: ${msg}`);
    }
    return result;
}

Actor.main(async () => {

    const input = await Actor.getInput() || {};
    const {
        text,
        outputKey    = 'audio',
        speakingRate = 1.0,
        noiseScale   = 0.667,
        noiseW       = 0.8,
    } = input;

    if (!text || !text.trim()) {
        throw new Error('El campo "text" es obligatorio en el input.');
    }
    if (!fs.existsSync(MODEL_PATH)) {
        throw new Error(`Modelo no encontrado: ${MODEL_PATH}`);
    }

    console.log(`✅  ffmpeg: ${ffmpegPath}`);
    console.log('🎙️  Piper TTS — es_ES mls_10246-low');
    console.log(`   Texto (${text.length} chars): ${text.substring(0, 80)}${text.length > 80 ? '…' : ''}`);

    const tmpDir  = fs.mkdtempSync(path.join(os.tmpdir(), 'piper-'));
    const wavFile = path.join(tmpDir, 'output.wav');
    const mp3File = path.join(tmpDir, 'output.mp3');

    try {

        // 1. Generar WAV con Piper
        run(PIPER_BIN, [
            '--model',        MODEL_PATH,
            '--output_file',  wavFile,
            '--noise_scale',  String(noiseScale),
            '--noise_w',      String(noiseW),
            '--length_scale', String((1.0 / speakingRate).toFixed(3)),
        ], {
            input: Buffer.from(text, 'utf8'),
        });

        if (!fs.existsSync(wavFile) || fs.statSync(wavFile).size === 0) {
            throw new Error('Piper no generó WAV o está vacío.');
        }
        console.log(`✅  WAV: ${(fs.statSync(wavFile).size / 1024).toFixed(1)} KB`);

        // 2. Convertir WAV → MP3
        console.log('🔄  Convirtiendo a MP3...');
        run(ffmpegPath, [
            '-y',
            '-i',        wavFile,
            '-codec:a',  'libmp3lame',
            '-qscale:a', '2',
            '-ar',       '22050',
            mp3File,
        ]);

        if (!fs.existsSync(mp3File) || fs.statSync(mp3File).size === 0) {
            throw new Error('ffmpeg no generó MP3 o está vacío.');
        }
        const mp3Size = fs.statSync(mp3File).size;
        console.log(`✅  MP3: ${(mp3Size / 1024).toFixed(1)} KB`);

        // 3. Subir al Key-Value Store
        const kvStore   = await Actor.openKeyValueStore();
        const storeId   = kvStore.id || 'default';
        const recordKey = `${outputKey}.mp3`;

        await kvStore.setValue(recordKey, fs.readFileSync(mp3File), {
            contentType: 'audio/mpeg',
        });
        console.log(`📦  KV Store → "${recordKey}"`);

        // 4. URL pública
        const mp3Url = `https://api.apify.com/v2/key-value-stores/${storeId}/records/${recordKey}`;

        // 5. Output en Dataset
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
        try { if (fs.existsSync(wavFile)) fs.unlinkSync(wavFile); } catch (_) {}
        try { if (fs.existsSync(mp3File)) fs.unlinkSync(mp3File); } catch (_) {}
        try { fs.rmdirSync(tmpDir); } catch (_) {}
    }
});
