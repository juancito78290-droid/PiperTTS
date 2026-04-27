import { Actor } from 'apify';
import { execFileSync } from 'child_process';
import fs from 'fs';

await Actor.init();

try {
    const input = await Actor.getInput();

    let text = input?.text || "Hola mundo";

    // 🔐 Sanitizar texto (evita romper comandos)
    text = text.replace(/["`$\\]/g, '');

    const MAX_CHARS = 500;

    // ✂️ Dividir texto para evitar RAM issues
    const chunks = text.match(new RegExp(`.{1,${MAX_CHARS}}`, 'g')) || [];

    const wavFiles = [];

    console.log(`Procesando ${chunks.length} bloques...`);

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const wavPath = `/tmp/part_${i}.wav`;

        execFileSync(process.env.PIPER_PATH, [
            '--model', process.env.MODEL_PATH,
            '--output_file', wavPath
        ], {
            input: chunk,
            timeout: 30000, // ⛔ evita cuelgues
            maxBuffer: 10 * 1024 * 1024
        });

        wavFiles.push(wavPath);
    }

    const finalWav = '/tmp/final.wav';

    // 🔗 Unir WAVs
    if (wavFiles.length === 1) {
        fs.copyFileSync(wavFiles[0], finalWav);
    } else {
        const concatList = '/tmp/list.txt';
        fs.writeFileSync(
            concatList,
            wavFiles.map(f => `file '${f}'`).join('\n')
        );

        execFileSync('ffmpeg', [
            '-y',
            '-f', 'concat',
            '-safe', '0',
            '-i', concatList,
            '-c', 'copy',
            finalWav
        ]);
    }

    const mp3 = '/tmp/output.mp3';

    // 🎧 Convertir a MP3 optimizado
    execFileSync('ffmpeg', [
        '-y',
        '-i', finalWav,
        '-codec:a', 'libmp3lame',
        '-qscale:a', '2',
        mp3
    ]);

    const store = await Actor.openKeyValueStore();

    await store.setValue('audio.mp3', fs.readFileSync(mp3), {
        contentType: 'audio/mpeg',
    });

    const url = store.getPublicUrl('audio.mp3');

    await Actor.setValue('OUTPUT', {
        success: true,
        url,
        chunks: chunks.length
    });

} catch (err) {
    console.error('ERROR REAL:', err);

    await Actor.setValue('OUTPUT', {
        success: false,
        error: err.message
    });
}

await Actor.exit();
