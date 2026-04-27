import { exec } from "child_process";
import fs from "fs";
import path from "path";

const TEXT = process.env.TEXT || "Hola, esto es una prueba de voz con Piper";
const OUTPUT = "output.wav";

function runPiper(text) {
    return new Promise((resolve, reject) => {
        const command = `echo "${text}" | piper --model /opt/models/model.onnx --output_file ${OUTPUT}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error("❌ Error ejecutando Piper:", error);
                reject(error);
                return;
            }

            console.log("✅ Audio generado:", OUTPUT);
            resolve();
        });
    });
}

async function main() {
    try {
        await runPiper(TEXT);

        if (fs.existsSync(OUTPUT)) {
            console.log("📁 Archivo listo para usar");
        } else {
            console.log("❌ No se generó el audio");
        }

    } catch (err) {
        console.error("❌ Fallo total:", err);
    }
}

main();
