const { Actor } = require('apify');
const { spawnSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const PIPER_BIN  = '/usr/local/bin/piper';
const MODEL_PATH = '/usr/local/piper/voices/es_ES-mls_10246-low.onnx';

// Piper escribe logs en stderr aunque todo vaya bien,
// y termina con status null (señal). Solo se evalúa si el archivo resultante existe.
function runPiper(args, inputBuffer) {
    const result = spawnSync(PIPER_BIN, args, {
        input:    inputBuffer,
        timeout:  120_000,
        encoding: 'buffer',
    });

    // Error de sistema (no se pudo lanzar el proceso)
    if (result.error) throw result.error;

    // Piper termina normalmente con status 0 o null — ambos son válidos
    // Solo fallamos si el status es un número distinto de 0
    if (result.status !== null && result.status !== 0) {
        const msg = result.stderr ? result.stderr.toString().trim() : 'sin stderr';
        throw new Error(`Piper falló con código ${result.status}: ${msg}`);
    }
}

// ffmpeg sí debe terminar con status 0 estrictamente
function runFfmpeg(args) {
    const result = spawnSync(ffmpegPath, args, {
        timeout:  60_000,
        encoding: 'buffer',
    });

    if (result.error) throw result.error;
    if (result.status !== 0) {
        const msg = result.stderr ? result.stderr.toString().trim() : 'sin stderr';
        throw new Error(`ffmpeg falló con código ${result.status}: ${msg}`);
    }
}

Actor.main(async () => {

    // ── Validaciones previas ──────────────────────────────────────────────────
    if (!fs.existsSync(PIPER_BIN)) {
        throw new Error(`Piper no encontrado en: ${PIPER_BIN}`);
    }
    if (!fs.existsSync(MODEL_PATH)) {
        throw new Error(`Modelo no encontrado en: ${MODEL_PATH}`);
    }
    if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
        throw new Error(`ffmpeg-static no disponible: ${ffmpegPath}`);
    }

    // ── Input ─────────────────────────────────────────────────────────────────
    const input = await Actor.getInput() || {};
    const {
        text,
        outputKey    = 'audio',
        speakingRate = 0.92,
        noiseScale   = 0.667,
        noiseW       = 0.8,
    } = input;

    if (!text || !text.trim()) {
        throw new Error('El campo "text" es obligatorio en el input.');
    }

    console.log(`✅  Piper   : ${PIPER_BIN}`);
    console.log(`✅  Modelo  : ${MODEL_PATH}`);
    console.log(`✅  ffmpeg  : ${ffmpegPath}`);
    console.log(`🎙️  Texto   : ${text.substring(0, 80)}${text.length > 80 ? '…' : ''}`);

    // ── Archivos temporales ───────────────────────────────────────────────────
    const tmpDir  = fs.mkdtempSync(path.join(os.tmpdir(), 'piper-'));
    const wavFile = path.join(tmpDir, 'output.wav');
    const mp3File = path.join(tmpDir, 'output.mp3');

    try {

        // 1. Generar WAV con Piper
        console.log('🔊  Generando WAV...');
        runPiper([
            '--model',        MODEL_PATH,
            '--output_file',  wavFile,
            '--noise_scale',  String(noiseScale),
            '--noise_w',      String(noiseW),
            '--length_scale', String((1.0 / speakingRate).toFixed(3)),
        ], Buffer.from(text, 'utf8'));

        // Validar que el WAV existe y tiene contenido real
        if (!fs.existsSync(wavFile) || fs.statSync(wavFile).size < 100) {
            throw new Error('Piper no generó WAV o el archivo está vacío/corrupto.');
        }
        console.log(`✅  WAV: ${(fs.statSync(wavFile).size / 1024).toFixed(1)} KB`);

        // 2. Convertir WAV → MP3
        console.log('🔄  Convirtiendo a MP3...');
        runFfmpeg([
            '-y',
            '-i',        wavFile,
            '-codec:a',  'libmp3lame',
            '-qscale:a', '2',
            '-ar',       '22050',
            mp3File,
        ]);

        if (!fs.existsSync(mp3File) || fs.statSync(mp3File).size < 100) {
            throw new Error('ffmpeg no generó MP3 o el archivo está vacío/corrupto.');
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
        console.log(`📦  KV Store → "${recordKey}" (storeId: ${storeId})`);

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
