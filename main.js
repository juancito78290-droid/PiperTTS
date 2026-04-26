FROM node:18-bullseye

# Instalar dependencias
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    python3 \
    python3-pip \
    bash \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar proyecto
COPY package*.json ./
RUN npm install

COPY . ./

# Instalar Piper (glibc compatible)
RUN mkdir -p /opt && \
    wget -O /tmp/piper.tar.gz https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz && \
    tar -xzf /tmp/piper.tar.gz -C /opt && \
    chmod -R 755 /opt/piper && \
    cp /opt/piper/piper /usr/bin/piper && \
    chmod 755 /usr/bin/piper && \
    rm /tmp/piper.tar.gz

# Modelos
RUN mkdir -p /models && \
    wget -O /models/es_AR-daniela-high.onnx \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high/es_AR-daniela-high.onnx && \
    wget -O /models/es_AR-daniela-high.onnx.json \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high/es_AR-daniela-high.onnx.json

CMD ["node", "main.js"]
