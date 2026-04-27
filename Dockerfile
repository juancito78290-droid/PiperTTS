FROM apify/actor-node:18

# Instalar dependencias
RUN apk add --no-cache \
    wget \
    ffmpeg \
    ca-certificates

# Instalar Piper
RUN mkdir -p /opt/piper \
    && wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz \
    && tar -xzf piper_linux_x86_64.tar.gz \
    && cp -r piper/* /opt/piper/ \
    && chmod +x /opt/piper/piper \
    && rm -rf piper piper_linux_x86_64.tar.gz

# Descargar modelo (ONNX + JSON)
RUN mkdir -p /models \
    && wget -O /models/model.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/roberta-medium/es_ES-roberta-medium.onnx \
    && wget -O /models/model.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/roberta-medium/es_ES-roberta-medium.onnx.json

WORKDIR /app
COPY . .

CMD ["node", "main.js"]
