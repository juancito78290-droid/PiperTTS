FROM apify/actor-node:18

USER root

# 🔥 Instalar dependencias necesarias (incluye espeak-ng)
RUN apk update && apk add --no-cache \
    ffmpeg \
    bash \
    wget \
    ca-certificates \
    libstdc++ \
    espeak-ng

# 🔥 Instalar Piper (versión estable correcta)
RUN mkdir -p /opt/piper && \
    wget -O /opt/piper/piper.tar.gz \
    https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz && \
    tar -xzf /opt/piper/piper.tar.gz -C /opt/piper && \
    mv /opt/piper/piper /usr/local/bin/piper && \
    chmod +x /usr/local/bin/piper && \
    rm -rf /opt/piper

# 🔥 Verificación (evita futuros errores silenciosos)
RUN which piper && piper --help

# 🔥 Descargar modelo válido (URL CORRECTA)
RUN mkdir -p /opt/models && \
    wget -O /opt/models/model.onnx \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/amy/low/es_ES-amy-low.onnx?download=true && \
    wget -O /opt/models/model.json \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/amy/low/es_ES-amy-low.onnx.json?download=true

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

USER node

CMD ["node", "main.js"]
