FROM node:18-bullseye-slim

ENV NODE_ENV=production
ENV APIFY_LOCAL_STORAGE_DIR=/home/myuser/apify_storage

# Crear usuario myuser compatible con Apify
RUN groupadd -r myuser && useradd -r -g myuser -m -d /home/myuser myuser

WORKDIR /home/myuser

# Solo wget y tar — ffmpeg se instala vía npm (ffmpeg-static)
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    tar \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Instalar Piper TTS binario
RUN mkdir -p /usr/local/piper && \
    wget -q "https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_linux_x86_64.tar.gz" \
        -O /tmp/piper.tar.gz && \
    tar -xzf /tmp/piper.tar.gz -C /usr/local/piper --strip-components=1 && \
    rm /tmp/piper.tar.gz && \
    chmod +x /usr/local/piper/piper && \
    ln -sf /usr/local/piper/piper /usr/local/bin/piper

# Descargar modelo es_ES mls_10246 low
RUN mkdir -p /usr/local/piper/voices && \
    wget -q "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx" \
        -O /usr/local/piper/voices/es_ES-mls_10246-low.onnx && \
    wget -q "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx.json" \
        -O /usr/local/piper/voices/es_ES-mls_10246-low.onnx.json

# Permisos al usuario
RUN chown -R myuser:myuser /home/myuser /usr/local/piper

# Instalar dependencias Node (incluye ffmpeg-static)
COPY --chown=myuser:myuser package.json ./
RUN npm install --omit=dev --no-optional

COPY --chown=myuser:myuser . ./

USER myuser

CMD ["node", "main.js"]
