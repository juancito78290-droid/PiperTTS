FROM apify/actor-node:18

# Alpine → usar apk
RUN apk add --no-cache \
    wget \
    ffmpeg \
    ca-certificates

# Instalar Piper
RUN mkdir -p /opt/piper && \
    wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz && \
    tar -xzf piper_linux_x86_64.tar.gz && \
    cp -r piper/* /opt/piper && \
    chmod +x /opt/piper/piper

# ✅ MODELO REAL (hls10246 LOW)
RUN mkdir -p /models && \
    wget -O /models/model.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/hls10246/low/es_ES-hls10246-low.onnx && \
    wget -O /models/model.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/hls10246/low/es_ES-hls10246-low.onnx.json

WORKDIR /app
COPY . .

CMD ["node", "main.js"]
