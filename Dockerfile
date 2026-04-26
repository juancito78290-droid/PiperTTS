FROM node:18-bullseye

RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    python3 \
    python3-pip \
    bash \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . ./

# 🔥 Instalar Piper
RUN mkdir -p /opt/piper && \
    wget -O /tmp/piper.tar.gz https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz && \
    tar -xzf /tmp/piper.tar.gz -C /opt/piper --strip-components=1 && \
    chmod -R 755 /opt/piper && \
    ln -s /opt/piper/piper /usr/bin/piper && \
    chmod 755 /opt/piper/piper && \
    rm /tmp/piper.tar.gz

# 👇 DEBUG
RUN ls -la /opt/piper && piper --help || true

# 🔥 MODELO LOW (CLAVE)
RUN mkdir -p /models && \
    wget -O /models/es_AR-daniela-low.onnx \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/low/es_AR-daniela-low.onnx && \
    wget -O /models/es_AR-daniela-low.onnx.json \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/low/es_AR-daniela-low.onnx.json

CMD ["node", "main.js"]
