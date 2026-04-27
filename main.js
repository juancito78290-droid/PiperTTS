const { Actor } = require('apify');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const PIPER_BIN  = '/usr/local/bin/piper';
const MODEL_PATH = '/usr/local/piper/voices/es_ES-mls_10246-low.onnx';

// Ejecuta Piper de forma asíncrona y espera a que termine
// Ignora el exit code — solo importa si el WAV existe al final
function runPiper(wavFile, text, noiseScale, noiseW, lengthScale) {
    return new Promise((resolve, reject) => {
        const proc = spawn(PIPER_BIN, [
            '--model',        MODEL_PATH,
            '--output_file',  wavFile,
            '--noise_scale',  String(noiseScale),
            '--noise_w',      String(noiseW),
            '--length_scale', String(lengthScale),
        ]);

        let stderrLog = '';
        proc.stderr.on('data', (data) => {
            stderrLog += data.toString();
        });

        // Error de sistema (proceso no pudo lanzarse)
        proc.on('error', (err) => reject(err));

        proc.on('close', () => {
            // No evaluamos el exit code de Piper — escribe logs en stderr
            // y puede terminar con señal (null). Solo importa el archivo WAV.
            console.log(`   Piper stderr: ${stderrLog.trim()}`);
            resolve();
        });

        // Enviar texto por stdin y cerrar
        proc.stdin.write(text, 'utf8');
        proc.stdin.end();
    });
}

// Ejecuta ffmpeg de forma asíncrona
function runFfmpeg(wavFile, mp3File) {
    return new Promise((resolve, reject) => {
        const proc = spawn(ffmpegPath, [
            '-y',
            '-i',        wavFile,
            '-codec:a',  'libmp3lame',
            '-qscale:a', '2',
            '-ar',       '22050',
            mp3File,
        ]);

        let stderrLog = '';
        proc.stderr.on('data', (data) => {
            stderrLog += data.toString();
        });

        proc.on('error', (err) => reject(err));

        proc.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`ffmpeg falló (código ${code}): ${stderrLog.trim()}`));
            }
            resolve();
        });
    });
}

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

    const lengthScale = (1.0 / speakingRate).toFixed(3);

    console.log(`✅  Piper  : ${PIPER_BIN}`);
    console.log(`✅  Modelo : ${MODEL_PATH}`);
    console.log(`✅  ffmpeg : ${ffmpegPath}`);
    console.log(`🎙️  Texto  : ${text.substring(0, 80)}${text.length > 80 ? '…' : ''}`);

    // ── Archivos temporales ───────────────────────────────────────────────────
    const tmpDir  = fs.mkdtempSync(path.join(os.tmpdir(), 'piper-'));
    const wavFile = path.join(tmpDir, 'output.wav');
    const mp3File = path.join(tmpDir, 'output.mp3');

    try {

        // 1. Generar WAV con Piper (async, stdin → output_file)
        console.log('🔊  Generando WAV...');
        await runPiper(wavFile, text, noiseScale, noiseW, lengthScale);

        // Esperar hasta 3 segundos a que el SO termine de escribir el archivo
        for (let i = 0; i < 6; i++) {
            if (fs.existsSync(wavFile) && fs.statSync(wavFile).size > 100) break;
            await new Promise(r => setTimeout(r, 500));
        }

        if (!fs.existsSync(wavFile) || fs.statSync(wavFile).size < 100) {
            throw new Error('Piper terminó pero no generó el archivo WAV.');
        }
        console.log(`✅  WAV: ${(fs.statSync(wavFile).size / 1024).toFixed(1)} KB`);

        // 2. Convertir WAV → MP3
        console.log('🔄  Convirtiendo a MP3...');
        await runFfmpeg(wavFile, mp3File);

        if (!fs.existsSync(mp3File) || fs.statSync(mp3File).size < 100) {
            throw new Error('ffmpeg no generó el MP3.');
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
