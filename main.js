const { Actor } = require('apify');
const { spawnSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const PIPER_BIN  = '/usr/local/bin/piper';
const MODEL_PATH = '/usr/local/piper/voices/es_ES-mls_10246-low.onnx';

Actor.main(async () => {

    // ── Validaciones ──────────────────────────────────────────────────────────
    if (!fs.existsSync(PIPER_BIN))  throw new Error(`Piper no encontrado: ${PIPER_BIN}`);
    if (!fs.existsSync(MODEL_PATH)) throw new Error(`Modelo no encontrado: ${MODEL_PATH}`);
    if (!ffmpegPath || !fs.existsSync(ffmpegPath)) throw new Error(`ffmpeg no encontrado: ${ffmpegPath}`);

    // ── Input ─────────────────────────────────────────────────────────────────
    const input = await Actor.getInput() || {};
    const {
        text,
        outputKey    = 'audio',
        speakingRate = 0.92,
        noiseScale   = 0.667,
        noiseW       = 0.8,
    } = input;

    if (!text || !text.trim()) throw new Error('El campo "text" es obligatorio.');

    const lengthScale = (1.0 / speakingRate).toFixed(3);

    console.log(`✅  Piper  : ${PIPER_BIN}`);
    console.log(`✅  Modelo : ${MODEL_PATH}`);
    console.log(`✅  ffmpeg : ${ffmpegPath}`);
    console.log(`🎙️  Texto  : ${text.substring(0, 80)}${text.length > 80 ? '…' : ''}`);

    // ── Archivos temporales ───────────────────────────────────────────────────
    const tmpDir   = fs.mkdtempSync(path.join(os.tmpdir(), 'piper-'));
    const txtFile  = path.join(tmpDir, 'input.txt');
    const wavFile  = path.join(tmpDir, 'output.wav');
    const mp3File  = path.join(tmpDir, 'output.mp3');

    try {

        // 1. Escribir texto en archivo — evita cualquier problema con stdin
        fs.writeFileSync(txtFile, text, 'utf8');
        console.log(`📝  Texto escrito en: ${txtFile}`);

        // 2. Ejecutar Piper con --input_file y --output_file
        console.log('🔊  Generando WAV...');

        const piperResult = spawnSync(PIPER_BIN, [
            '--model',        MODEL_PATH,
            '--input_file',   txtFile,
            '--output_file',  wavFile,
            '--noise_scale',  String(noiseScale),
            '--noise_w',      String(noiseW),
            '--length_scale', String(lengthScale),
        ], {
            timeout:  120_000,
            encoding: 'buffer',
        });

        // Mostrar siempre el stderr de Piper para diagnóstico
        if (piperResult.stderr && piperResult.stderr.length > 0) {
            console.log(`   Piper log: ${piperResult.stderr.toString().trim()}`);
        }

        // Error de sistema (el proceso no pudo lanzarse)
        if (piperResult.error) throw piperResult.error;

        // Verificar que el WAV existe y tiene contenido
        if (!fs.existsSync(wavFile) || fs.statSync(wavFile).size < 100) {
            throw new Error(
                `Piper no generó el WAV. ` +
                `Exit: ${piperResult.status} | ` +
                `stderr: ${piperResult.stderr ? piperResult.stderr.toString().trim() : 'vacío'}`
            );
        }

        console.log(`✅  WAV: ${(fs.statSync(wavFile).size / 1024).toFixed(1)} KB`);

        // 3. Convertir WAV → MP3
        console.log('🔄  Convirtiendo a MP3...');

        const ffResult = spawnSync(ffmpegPath, [
            '-y',
            '-i',        wavFile,
            '-codec:a',  'libmp3lame',
            '-qscale:a', '2',
            '-ar',       '22050',
            mp3File,
        ], {
            timeout:  60_000,
            encoding: 'buffer',
        });

        if (ffResult.error) throw ffResult.error;
        if (ffResult.status !== 0) {
            throw new Error(
                `ffmpeg falló (código ${ffResult.status}): ` +
                `${ffResult.stderr ? ffResult.stderr.toString().trim() : 'sin stderr'}`
            );
        }

        if (!fs.existsSync(mp3File) || fs.statSync(mp3File).size < 100) {
            throw new Error('ffmpeg no generó el MP3 o está vacío.');
        }

        const mp3Size = fs.statSync(mp3File).size;
        console.log(`✅  MP3: ${(mp3Size / 1024).toFixed(1)} KB`);

        // 4. Subir al Key-Value Store
        const kvStore   = await Actor.openKeyValueStore();
        const storeId   = kvStore.id || 'default';
        const recordKey = `${outputKey}.mp3`;

        await kvStore.setValue(recordKey, fs.readFileSync(mp3File), {
            contentType: 'audio/mpeg',
        });
        console.log(`📦  KV Store → "${recordKey}" (storeId: ${storeId})`);

        // 5. URL pública
        const mp3Url = `https://api.apify.com/v2/key-value-stores/${storeId}/records/${recordKey}`;

        // 6. Output en Dataset
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
        try { if (fs.existsSync(txtFile)) fs.unlinkSync(txtFile); } catch (_) {}
        try { if (fs.existsSync(wavFile)) fs.unlinkSync(wavFile); } catch (_) {}
        try { if (fs.existsSync(mp3File)) fs.unlinkSync(mp3File); } catch (_) {}
        try { fs.rmdirSync(tmpDir); } catch (_) {}
    }
});
