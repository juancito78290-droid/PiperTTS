FROM node:18-bullseye

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Piper
WORKDIR /tmp

RUN wget -q https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_linux_x64.tar.gz \
    && tar -xzf piper_linux_x64.tar.gz \
    && mv piper/piper /usr/local/bin/piper \
    && chmod +x /usr/local/bin/piper \
    && rm -rf piper*

# Modelos
RUN mkdir -p /models

RUN wget -q -O /models/model.onnx \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx

RUN wget -q -O /models/model.onnx.json \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx.json

# App
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

CMD ["node", "main.js"]
