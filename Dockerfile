FROM node:20

# instalar dependencias
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# instalar piper correctamente (en Debian sí funciona)
RUN pip3 install --no-cache-dir piper-tts

# descargar modelo argentino
RUN wget -O es_AR.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high/es_AR-daniela-high.onnx

RUN wget -O es_AR.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high/es_AR-daniela-high.onnx.json

# copiar código
COPY . ./

CMD ["node", "main.js"]
