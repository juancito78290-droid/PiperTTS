FROM apify/actor-node:18

USER root

# Dependencias mínimas + ffmpeg
RUN apk add --no-cache \
    ffmpeg \
    bash \
    wget \
    ca-certificates \
    libstdc++ \
    unzip

# Carpeta de trabajo
WORKDIR /app

# Descargar Piper (versión correcta que SÍ existe)
RUN mkdir -p /opt/piper && \
    wget -O /opt/piper/piper.tar.gz \
    https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz && \
    tar -xzf /opt/piper/piper.tar.gz -C /opt/piper --strip-components=1 && \
    chmod +x /opt/piper/piper && \
    rm /opt/piper/piper.tar.gz

# Descargar modelo español (ligero)
RUN mkdir -p /opt/models && \
    wget -O /opt/models/es.onnx \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/amy/low/es_ES-amy-low.onnx && \
    wget -O /opt/models/es.json \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/amy/low/es_ES-amy-low.onnx.json

# Copiar app
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Variables
ENV PIPER_BIN=/opt/piper/piper
ENV MODEL_PATH=/opt/models/es.onnx

# Ejecutar actor
CMD ["node", "main.js"]
