FROM apify/actor-node:20

# instalar ffmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# instalar piper
RUN pip install --no-cache-dir piper-tts

# instalar wget
RUN apt-get update && apt-get install -y wget

# descargar modelo argentino (daniela)
RUN wget -O es_AR.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high/es_AR-daniela-high.onnx

RUN wget -O es_AR.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high/es_AR-daniela-high.onnx.json

# copiar código
COPY . ./

CMD ["node", "main.js"]
