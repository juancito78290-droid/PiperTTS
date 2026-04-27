import { Actor } from 'apify';
import { execSync } from 'child_process';
import fs from 'fs';

await Actor.init();

const input = await Actor.getInput();

// INPUT esperado:
// {
//   "wavUrl": "https://.../audio.wav"
// }

if (!input?.wavUrl) {
    throw new Error('Falta wavUrl');
}

const wavPath = '/tmp/input.wav';
const mp3Path = '/tmp/output.mp3';

try {
    // 1. Descargar WAV
    const response = await fetch(input.wavUrl);
    if (!response.ok) throw new Error('No se pudo descargar WAV');

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(wavPath, buffer);

    // 2. Convertir a MP3
    execSync(`ffmpeg -y -i ${wavPath} -codec:a libmp3lame -qscale:a 2 ${mp3Path}`);

    // 3. Leer archivo MP3
    const mp3Buffer = fs.readFileSync(mp3Path);

    // 4. Subir a Key-Value Store (link público)
    const store = await Actor.openKeyValueStore();
    const key = 'output.mp3';

    await store.setValue(key, mp3Buffer, {
        contentType: 'audio/mpeg',
    });

    const publicUrl = `https://api.apify.com/v2/key-value-stores/${store.id}/records/${key}?disableRedirect=true`;

    // 5. Output final
    await Actor.setOutput({
        success: true,
        mp3Url: publicUrl,
    });

} catch (err) {
    console.error(err);
    await Actor.setOutput({
        success: false,
        error: err.message,
    });
}

await Actor.exit();
