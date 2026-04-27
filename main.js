const { Actor } = require('apify');
const { execSync } = require('child_process');
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

    // ── Archivos temporales en /home/myuser (permisos garantizados) ───────────
    const tmpDir  = fs.mkdtempSync(path.join('/home/myuser', 'piper-'));
    const txtFile = path.join(tmpDir, 'input.txt');
    const wavFile = path.join(tmpDir, 'output.wav');
    const mp3File = path.join(tmpDir, 'output.mp3');

    try {

        // 1. Escribir texto en archivo
        fs.writeFileSync(txtFile, text, 'utf8');
        console.log(`📝  Archivo de texto: ${txtFile}`);

        // 2. Ejecutar Piper via shell pipe — método oficial documentado
        //    cat archivo.txt | piper --model modelo.onnx --output_file salida.wav
        console.log('🔊  Generando WAV...');

        // Escapar comillas simples en el texto para el shell
        const safeTxtFile = txtFile.replace(/'/g, "'\\''");
        const safeWavFile = wavFile.replace(/'/g, "'\\''");

        const piperCmd = [
            `cat '${safeTxtFile}'`,
            `|`,
            `'${PIPER_BIN}'`,
            `--model '${MODEL_PATH}'`,
            `--output_file '${safeWavFile}'`,
            `--noise_scale ${noiseScale}`,
            `--noise_w ${noiseW}`,
            `--length_scale ${lengthScale}`,
        ].join(' ');

        console.log(`   CMD: ${piperCmd}`);

        execSync(piperCmd, {
            shell:   '/bin/sh',
            timeout: 120_000,
            stdio:   ['pipe', 'pipe', 'pipe'],
        });

        // 3. Verificar WAV
        if (!fs.existsSync(wavFile) || fs.statSync(wavFile).size < 100) {
            throw new Error('Piper no generó el WAV o está vacío.');
        }
        console.log(`✅  WAV: ${(fs.statSync(wavFile).size / 1024).toFixed(1)} KB`);

        // 4. Convertir WAV → MP3
        console.log('🔄  Convirtiendo a MP3...');

        const ffmpegCmd = [
            `'${ffmpegPath}'`,
            `-y`,
            `-i '${safeWavFile}'`,
            `-codec:a libmp3lame`,
            `-qscale:a 2`,
            `-ar 22050`,
            `'${mp3File}'`,
        ].join(' ');

        execSync(ffmpegCmd, {
            shell:   '/bin/sh',
            timeout: 60_000,
            stdio:   ['pipe', 'pipe', 'pipe'],
        });

        if (!fs.existsSync(mp3File) || fs.statSync(mp3File).size < 100) {
            throw new Error('ffmpeg no generó el MP3 o está vacío.');
        }
        const mp3Size = fs.statSync(mp3File).size;
        console.log(`✅  MP3: ${(mp3Size / 1024).toFixed(1)} KB`);

        // 5. Subir al Key-Value Store
        const kvStore   = await Actor.openKeyValueStore();
        const storeId   = kvStore.id || 'default';
        const recordKey = `${outputKey}.mp3`;

        await kvStore.setValue(recordKey, fs.readFileSync(mp3File), {
            contentType: 'audio/mpeg',
        });
        console.log(`📦  KV Store → "${recordKey}" (storeId: ${storeId})`);

        // 6. URL pública
        const mp3Url = `https://api.apify.com/v2/key-value-stores/${storeId}/records/${recordKey}`;

        // 7. Output en Dataset
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
