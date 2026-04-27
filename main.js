import { execSync } from "child_process";
import fs from "fs";
import Apify from "apify";

const text = process.env.TEXT || "Hola, este es un test de voz con Piper";

const WAV_PATH = "/tmp/output.wav";
const MP3_PATH = "/tmp/output.mp3";

(async () => {
    try {
        await Apify.init();

        console.log("🧠 Generando audio con Piper...");

        execSync(`
            echo "${text.replace(/"/g, '\\"')}" | \
            piper \
            --model /opt/models/model.onnx \
            --output_file ${WAV_PATH}
        `, { stdio: "inherit" });

        console.log("🔄 Convirtiendo a MP3...");

        execSync(`
            ffmpeg -y -i ${WAV_PATH} -codec:a libmp3lame -qscale:a 2 ${MP3_PATH}
        `, { stdio: "inherit" });

        const fileBuffer = fs.readFileSync(MP3_PATH);
        const fileName = `output-${Date.now()}.mp3`;

        await Apify.setValue(fileName, fileBuffer, {
            contentType: "audio/mpeg"
        });

        const url = `https://api.apify.com/v2/key-value-stores/default/records/${fileName}`;

        console.log("✅ MP3 URL:", url);

        // 🔥 CIERRE CORRECTO DEL ACTOR
        await Apify.exit();

    } catch (err) {
        console.error("❌ ERROR:", err.message);

        // 🔥 también cerrar en error
        await Apify.exit();

        process.exit(1);
    }
})();
