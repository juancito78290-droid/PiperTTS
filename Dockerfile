FROM apify/actor-node:20

# instalar dependencias
RUN apk add --no-cache ffmpeg wget python3 py3-pip

# instalar piper (FIX)
RUN pip3 install --no-cache-dir piper-tts --break-system-packages

# descargar modelo argentina
RUN wget -O es_AR.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high/es_AR-daniela-high.onnx

RUN wget -O es_AR.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high/es_AR-daniela-high.onnx.json

# copiar código
COPY . ./

CMD ["node", "main.js"]
