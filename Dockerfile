FROM node:18-bullseye

# Variables de entorno requeridas por Apify SDK
ENV APIFY_LOCAL_STORAGE_DIR=/home/myuser/apify_storage
ENV NODE_ENV=production

# Crear usuario no-root igual que Apify (evita problemas de permisos en la plataforma)
RUN groupadd -r myuser && useradd -r -g myuser -m -d /home/myuser myuser

WORKDIR /home/myuser

# Instalar ffmpeg + wget + tar como root
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    wget \
    tar \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Instalar Piper TTS binario (Linux x86_64)
RUN mkdir -p /usr/local/piper && \
    wget -q "https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_linux_x86_64.tar.gz" \
        -O /tmp/piper.tar.gz && \
    tar -xzf /tmp/piper.tar.gz -C /usr/local/piper --strip-components=1 && \
    rm /tmp/piper.tar.gz && \
    chmod +x /usr/local/piper/piper && \
    ln -sf /usr/local/piper/piper /usr/local/bin/piper

# Descargar modelo es_ES mls_10246 low desde HuggingFace
RUN mkdir -p /usr/local/piper/voices && \
    wget -q "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx" \
        -O /usr/local/piper/voices/es_ES-mls_10246-low.onnx && \
    wget -q "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx.json" \
        -O /usr/local/piper/voices/es_ES-mls_10246-low.onnx.json

# Dar permisos al usuario sobre los archivos necesarios
RUN chown -R myuser:myuser /home/myuser /usr/local/piper

# Copiar package.json e instalar dependencias Node
COPY --chown=myuser:myuser package.json ./
RUN npm install --omit=dev --no-optional

# Copiar código fuente
COPY --chown=myuser:myuser . ./

# Cambiar a usuario no-root para el runtime
USER myuser

CMD ["node", "main.js"]
