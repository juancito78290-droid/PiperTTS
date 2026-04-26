FROM apify/actor-node:18

RUN apk add --no-cache \
    ffmpeg \
    wget \
    git \
    python3 \
    py3-pip \
    bash

# Instalar Piper (VERSIÓN REAL EXISTENTE)
RUN mkdir -p /opt/piper && \
    wget -O /tmp/piper.tar.gz https://github.com/rhasspy/piper/releases/download/v1.1.0/piper_linux_x86_64.tar.gz && \
    tar -xzf /tmp/piper.tar.gz -C /opt/piper && \
    chmod +x /opt/piper/piper && \
    ln -s /opt/piper/piper /usr/local/bin/piper && \
    rm /tmp/piper.tar.gz

# Crear carpeta de modelos
RUN mkdir -p /models

# Modelo Daniela (CORRECTO)
RUN wget -O /models/es_AR-daniela-high.onnx \
https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high/es_AR-daniela-high.onnx \
&& wget -O /models/es_AR-daniela-high.onnx.json \
https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high/es_AR-daniela-high.onnx.json

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

CMD ["node", "main.js"]
