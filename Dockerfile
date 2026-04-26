FROM apify/actor-node:20

# instalar ffmpeg + wget en Alpine
RUN apk add --no-cache ffmpeg wget python3 py3-pip

# instalar piper
RUN pip3 install --no-cache-dir piper-tts

# descargar modelo argentino (daniela)
RUN wget -O es_AR.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high/es_AR-daniela-high.onnx

RUN wget -O es_AR.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high/es_AR-daniela-high.onnx.json

# copiar código
COPY . ./

CMD ["node", "main.js"]
