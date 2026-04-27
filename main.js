const { Actor } = require('apify');
const { spawnSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const PIPER_BIN  = '/usr/local/bin/piper';
const MODEL_PATH = '/usr/local/piper/voices/es_ES-mls_10246-low.onnx';

Actor.main(async () => {

    // ── Validaciones previas ──────────────────────────────────────────────────
    if (!fs.existsSync(PIPER_BIN)) {
        throw new Error(`Piper no encontrado: ${PIPER_BIN}`);
    }
    if (!fs.existsSync(MODEL_PATH)) {
        throw new Error(`Modelo no encontrado: ${MODEL_PATH}`);
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

    console.log(`✅  Piper  : ${PIPER_BIN}`);
    console.log(`✅  Modelo : ${MODEL_PATH}`);
    console.log(`✅  ffmpeg : ${ffmpegPath}`);
    console.log(`🎙️  Texto  : ${text.substring(0, 80)}${text.length > 80 ? '…' : ''}`);

    // ── Archivos temporales ───────────────────────────────────────────────────
    const tmpDir  = fs.mkdtempSync(path.join(os.tmpdir(), 'piper-'));
    const wavFile = path.join(tmpDir, 'output.wav');
    const mp3File = path.join(tmpDir, 'output.mp3');

    try {

        // ── 1. Piper escribe WAV a stdout, lo capturamos y guardamos ──────────
        console.log('🔊  Generando WAV via stdout...');

        const piperResult = spawnSync(PIPER_BIN, [
            '--model',        MODEL_PATH,
            '--output-raw',               // WAV crudo a stdout
            '--noise_scale',  String(noiseScale),
            '--noise_w',      String(noiseW),
            '--length_scale', String((1.0 / speakingRate).toFixed(3)),
        ], {
            input:    Buffer.from(text, 'utf8'),
            timeout:  120_000,
            encoding: 'buffer',
            maxBuffer: 100 * 1024 * 1024, // 100 MB por si el audio es largo
        });

        if (piperResult.error) throw piperResult.error;

        // stdout contiene el audio RAW (PCM), stderr contiene logs informativos
        const rawAudio = piperResult.stdout;

        if (!rawAudio || rawAudio.length < 100) {
            const errMsg = piperResult.stderr ? piperResult.stderr.toString().trim() : 'sin stderr';
            throw new Error(`Piper no generó audio. stderr: ${errMsg}`);
        }

        console.log(`✅  Audio RAW: ${(rawAudio.length / 1024).toFixed(1)} KB`);

        // ── 2. Convertir PCM RAW → MP3 con ffmpeg ────────────────────────────
        // El modelo mls_10246-low usa 16000 Hz, mono, 16-bit signed little-endian
        console.log('🔄  Convirtiendo RAW → MP3...');

        // Guardar el raw temporalmente para pasarlo a ffmpeg
        fs.writeFileSync(wavFile, rawAudio);

        const ffmpegResult = spawnSync(ffmpegPath, [
            '-y',
            '-f',        's16le',    // formato PCM signed 16-bit little-endian
            '-ar',       '16000',    // sample rate del modelo low = 16000 Hz
            '-ac',       '1',        // mono
            '-i',        wavFile,    // input PCM
            '-codec:a',  'libmp3lame',
            '-qscale:a', '2',        // VBR alta calidad
            '-ar',       '22050',    // upsample a 22050 Hz para mejor compatibilidad
            mp3File,
        ], {
            timeout:  60_000,
            encoding: 'buffer',
        });

        if (ffmpegResult.error) throw ffmpegResult.error;
        if (ffmpegResult.status !== 0) {
            const errMsg = ffmpegResult.stderr ? ffmpegResult.stderr.toString().trim() : 'sin stderr';
            throw new Error(`ffmpeg falló con código ${ffmpegResult.status}: ${errMsg}`);
        }

        if (!fs.existsSync(mp3File) || fs.statSync(mp3File).size < 100) {
            throw new Error('ffmpeg no generó MP3 o está vacío.');
        }
        const mp3Size = fs.statSync(mp3File).size;
        console.log(`✅  MP3: ${(mp3Size / 1024).toFixed(1)} KB`);

        // ── 3. Subir MP3 al Key-Value Store ──────────────────────────────────
        const kvStore   = await Actor.openKeyValueStore();
        const storeId   = kvStore.id || 'default';
        const recordKey = `${outputKey}.mp3`;

        await kvStore.setValue(recordKey, fs.readFileSync(mp3File), {
            contentType: 'audio/mpeg',
        });
        console.log(`📦  KV Store → "${recordKey}" (storeId: ${storeId})`);

        // ── 4. URL pública ────────────────────────────────────────────────────
        const mp3Url = `https://api.apify.com/v2/key-value-stores/${storeId}/records/${recordKey}`;

        // ── 5. Output en Dataset ──────────────────────────────────────────────
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
