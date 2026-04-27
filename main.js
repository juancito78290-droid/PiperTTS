const { Actor } = require('apify');
const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const PIPER_BIN  = '/usr/local/bin/piper';
const MODEL_PATH = '/usr/local/piper/voices/es_ES-mls_10246-low.onnx';

// Divide texto en frases para evitar picos de RAM
function splitSentences(text) {
    const sentences = text
        .split(/(?<=[.!?¡¿,;:])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    return sentences.length > 0 ? sentences : [text.trim()];
}

// execSync con reintentos automáticos
function execWithRetry(cmd, opts = {}, retries = 3) {
    let lastError;
    for (let i = 1; i <= retries; i++) {
        try {
            execSync(cmd, { shell: '/bin/sh', timeout: 120_000, ...opts });
            return;
        } catch (err) {
            lastError = err;
            console.log(`   ⚠️  Intento ${i}/${retries} falló. Reintentando...`);
            // Espera 1s entre intentos
            execSync('sleep 1');
        }
    }
    throw lastError;
}

Actor.main(async () => {

    // ── Validaciones ──────────────────────────────────────────────────────────
    if (!fs.existsSync(PIPER_BIN))
        throw new Error(`Piper no encontrado: ${PIPER_BIN}`);
    if (!fs.existsSync(MODEL_PATH))
        throw new Error(`Modelo no encontrado: ${MODEL_PATH}`);
    if (!ffmpegPath || !fs.existsSync(ffmpegPath))
        throw new Error(`ffmpeg no encontrado: ${ffmpegPath}`);

    // ── Input ─────────────────────────────────────────────────────────────────
    const input = await Actor.getInput() || {};
    const {
        text,
        outputKey    = 'audio',
        speakingRate = 0.92,
        noiseScale   = 0.667,
        noiseW       = 0.8,
    } = input;

    if (!text || !text.trim())
        throw new Error('El campo "text" es obligatorio.');

    const lengthScale = (1.0 / speakingRate).toFixed(3);

    console.log(`✅  Piper  : ${PIPER_BIN}`);
    console.log(`✅  Modelo : ${MODEL_PATH}`);
    console.log(`✅  ffmpeg : ${ffmpegPath}`);
    console.log(`🎙️  Texto  : ${text.substring(0, 80)}${text.length > 80 ? '…' : ''}`);

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'piper-'));
    const mp3File = path.join(tmpDir, 'output.mp3');

    try {

        // ── Procesar frase por frase ───────────────────────────────────────────
        const sentences = splitSentences(text);
        console.log(`📝  Frases: ${sentences.length}`);

        const wavFiles = [];

        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i];
            const txtFile  = path.join(tmpDir, `chunk_${i}.txt`);
            const wavFile  = path.join(tmpDir, `chunk_${i}.wav`);

            fs.writeFileSync(txtFile, sentence, 'utf8');
            console.log(`🔊  [${i + 1}/${sentences.length}] "${sentence.substring(0, 60)}${sentence.length > 60 ? '…' : ''}"`);

            // Piper con reintentos
            execWithRetry(
                `cat "${txtFile}" | "${PIPER_BIN}" ` +
                `--model "${MODEL_PATH}" ` +
                `--output_file "${wavFile}" ` +
                `--noise_scale ${noiseScale} ` +
                `--noise_w ${noiseW} ` +
                `--length_scale ${lengthScale} ` +
                `--sentence-silence 0.3`
            );

            // Verificar WAV generado
            if (!fs.existsSync(wavFile) || fs.statSync(wavFile).size < 100) {
                throw new Error(`WAV vacío o no generado para frase ${i + 1}: "${sentence}"`);
            }

            console.log(`   ✅ WAV ${i + 1}: ${(fs.statSync(wavFile).size / 1024).toFixed(1)} KB`);
            wavFiles.push(wavFile);

            // Limpiar txt procesado de inmediato
            try { fs.unlinkSync(txtFile); } catch (_) {}
        }

        // ── Concatenar WAVs y convertir a MP3 ─────────────────────────────────
        console.log('🔄  Convirtiendo a MP3...');

        let ffmpegCmd;

        if (wavFiles.length === 1) {
            ffmpegCmd =
                `"${ffmpegPath}" -y ` +
                `-i "${wavFiles[0]}" ` +
                `-codec:a libmp3lame -qscale:a 2 -ar 22050 "${mp3File}"`;
        } else {
            const inputs = wavFiles.map(f => `-i "${f}"`).join(' ');
            const filter = `[${wavFiles.map((_, i) => `${i}:a`).join('][')}]` +
                           `concat=n=${wavFiles.length}:v=0:a=1[out]`;
            ffmpegCmd =
                `"${ffmpegPath}" -y ` +
                `${inputs} ` +
                `-filter_complex "${filter}" -map "[out]" ` +
                `-codec:a libmp3lame -qscale:a 2 -ar 22050 "${mp3File}"`;
        }

        execWithRetry(ffmpegCmd, { timeout: 120_000 });

        if (!fs.existsSync(mp3File) || fs.statSync(mp3File).size < 100) {
            throw new Error('ffmpeg no generó el MP3 o está vacío.');
        }

        const mp3Size = fs.statSync(mp3File).size;
        console.log(`✅  MP3: ${(mp3Size / 1024).toFixed(1)} KB`);

        // ── Subir al Key-Value Store ───────────────────────────────────────────
        const kvStore   = await Actor.openKeyValueStore();
        const storeId   = kvStore.id || 'default';
        const recordKey = `${outputKey}.mp3`;

        await kvStore.setValue(recordKey, fs.readFileSync(mp3File), {
            contentType: 'audio/mpeg',
        });
        console.log(`📦  KV Store → "${recordKey}" (storeId: ${storeId})`);

        const mp3Url = `https://api.apify.com/v2/key-value-stores/${storeId}/records/${recordKey}`;

        await Actor.pushData({
            success      : true,
            mp3Url,
            storeId,
            recordKey,
            model        : 'es_ES-mls_10246-low',
            sentences    : sentences.length,
            textLength   : text.length,
            mp3SizeBytes : mp3Size,
            generatedAt  : new Date().toISOString(),
        });

        console.log(`\n🎉  URL del MP3:\n    ${mp3Url}\n`);

    } finally {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
    }
});
