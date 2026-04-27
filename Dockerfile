FROM apify/actor-node:18

USER root

RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    tar \
    && rm -rf /var/lib/apt/lists/*

# Instalar Piper TTS binario Linux x86_64
RUN mkdir -p /usr/local/piper && \
    wget -q https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_linux_x86_64.tar.gz \
        -O /tmp/piper.tar.gz && \
    tar -xzf /tmp/piper.tar.gz -C /usr/local/piper --strip-components=1 && \
    rm /tmp/piper.tar.gz && \
    chmod +x /usr/local/piper/piper && \
    ln -s /usr/local/piper/piper /usr/local/bin/piper

# Descargar modelo es_ES mls_10246 (low) desde HuggingFace
RUN mkdir -p /usr/local/piper/voices && \
    wget -q "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx" \
        -O /usr/local/piper/voices/es_ES-mls_10246-low.onnx && \
    wget -q "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx.json" \
        -O /usr/local/piper/voices/es_ES-mls_10246-low.onnx.json

COPY package.json ./
RUN npm install --omit=dev
COPY . ./

USER myuser
