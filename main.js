import { execSync } from "child_process";
import fs from "fs";
import { Actor } from "apify";

await Actor.init();

const text = process.env.TEXT || "Hola, este es un test de voz con Piper";

const WAV_PATH = "/tmp/output.wav";
const MP3_PATH = "/tmp/output.mp3";

try {
    console.log("🧠 Generando audio con Piper...");

    // 🔥 Escapar texto correctamente
    const safeText = text.replace(/"/g, '\\"');

    execSync(`
        echo "${safeText}" | \
        /usr/local/bin/piper \
        --model /opt/models/model.onnx \
        --output_file ${WAV_PATH}
    `, { stdio: "inherit" });

    console.log("🔄 Convirtiendo a MP3...");

    execSync(`
        ffmpeg -y -i ${WAV_PATH} -codec:a libmp3lame -qscale:a 2 ${MP3_PATH}
    `, { stdio: "inherit" });

    const buffer = fs.readFileSync(MP3_PATH);
    const fileName = `output-${Date.now()}.mp3`;

    await Actor.setValue(fileName, buffer, {
        contentType: "audio/mpeg"
    });

    const url = `https://api.apify.com/v2/key-value-stores/default/records/${fileName}`;

    console.log("✅ MP3 URL:", url);

} catch (err) {
    console.error("❌ ERROR:", err);
    process.exit(1);
}

await Actor.exit();
