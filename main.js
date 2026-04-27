import { Actor } from 'apify';
import { exec } from 'child_process';
import fs from 'fs/promises';
import util from 'util';

const execPromise = util.promisify(exec);

await Actor.init();

// 📥 Input del actor
const input = await Actor.getInput();

const text = input?.text || "Hola, esto es una prueba con Piper.";
const videoUrl = input?.videoUrl || null;

const WAV_FILE = "output.wav";
const MP3_FILE = "output.mp3";
const VIDEO_FILE = "video.mp4";
const FINAL_FILE = "final.mp4";

try {
    // 🔊 1. Generar audio con Piper
    console.log("🎤 Generando audio...");
    await execPromise(`echo "${text}" | piper --model /models/model.onnx --output_file ${WAV_FILE}`);

    // 🎵 2. Convertir a MP3
    console.log("🎧 Convirtiendo a MP3...");
    await execPromise(`ffmpeg -y -i ${WAV_FILE} ${MP3_FILE}`);

    // 🎬 3. Si hay video → descargar
    if (videoUrl) {
        console.log("📥 Descargando video...");
        await execPromise(`wget -O ${VIDEO_FILE} "${videoUrl}"`);

        // 🎞️ 4. Unir audio + video
        console.log("🎬 Uniendo audio y video...");
        await execPromise(`ffmpeg -y -i ${VIDEO_FILE} -i ${MP3_FILE} -c:v copy -c:a aac -shortest ${FINAL_FILE}`);

        // 📦 Guardar resultado
        const videoBuffer = await fs.readFile(FINAL_FILE);

        await Actor.setValue('OUTPUT_VIDEO', videoBuffer, {
            contentType: 'video/mp4'
        });

        console.log("✅ Video final guardado en Key-Value Store (OUTPUT_VIDEO)");
    } else {
        // 📦 Solo audio
        const audioBuffer = await fs.readFile(MP3_FILE);

        await Actor.setValue('OUTPUT_AUDIO', audioBuffer, {
            contentType: 'audio/mpeg'
        });

        console.log("✅ Audio guardado en Key-Value Store (OUTPUT_AUDIO)");
    }

} catch (error) {
    console.error("❌ ERROR:", error.stderr || error.message);
    throw error;
}

await Actor.exit();
