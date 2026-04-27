import { execSync } from "child_process";
import fs from "fs";

const TEXT = "Hola, este es un ejemplo con Piper funcionando correctamente.";
const AUDIO = "audio.wav";
const VIDEO_IN = "input.mp4";
const VIDEO_OUT = "output.mp4";

// 1. Generar audio con Piper
console.log("Generando audio...");
execSync(`echo "${TEXT}" | piper --model /models/model.onnx --output_file ${AUDIO}`);

// 2. Verificar que el audio existe
if (!fs.existsSync(AUDIO)) {
  throw new Error("No se generó el audio");
}

// 3. Unir audio + video
console.log("Uniendo audio y video...");
execSync(`
ffmpeg -y -i ${VIDEO_IN} -i ${AUDIO} \
-c:v copy -c:a aac -shortest ${VIDEO_OUT}
`);

console.log("✅ Video generado:", VIDEO_OUT);
