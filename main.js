import { Actor } from "apify";
import { execSync } from "child_process";
import fs from "fs";

await Actor.init();

const input = await Actor.getInput();
const text = input?.text || "Hola, este es un test de voz con Piper";

const WAV_PATH = "/tmp/output.wav";
const MP3_PATH = "/tmp/output.mp3";

try {
    console.log("🧠 Generando audio con Piper...");

    execSync(`
        echo "${text.replace(/"/g, '\\"')}" | \
        ${process.env.PIPER_BIN} \
        --model ${process.env.MODEL_PATH} \
        --output_file ${WAV_PATH}
    `, { stdio: "inherit" });

    console.log("🔄 Convirtiendo a MP3...");

    execSync(`
        ffmpeg -y -i ${WAV_PATH} -codec:a libmp3lame -qscale:a 2 ${MP3_PATH}
    `, { stdio: "inherit" });

    const fileBuffer = fs.readFileSync(MP3_PATH);
    const fileName = `output-${Date.now()}.mp3`;

    await Actor.setValue(fileName, fileBuffer, {
        contentType: "audio/mpeg",
    });

    const url = `https://api.apify.com/v2/key-value-stores/default/records/${fileName}`;

    console.log("✅ MP3 URL:", url);

} catch (err) {
    console.error("❌ ERROR:", err);
    throw err;
} finally {
    await Actor.exit();
}
