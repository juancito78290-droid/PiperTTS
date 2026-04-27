FROM node:18-bullseye

WORKDIR /app

RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    tar \
    libstdc++6 \
    libgcc-s1 \
    libespeak-ng1 \
    espeak-ng \
    && rm -rf /var/lib/apt/lists/*

# Instalar Piper (binario correcto)
WORKDIR /opt/piper

RUN wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz \
    && tar -xzf piper_linux_x86_64.tar.gz \
    && cp piper/piper /usr/local/bin/piper \
    && chmod +x /usr/local/bin/piper

RUN which piper && piper --help

# Modelo
RUN mkdir -p /opt/models \
    && wget -O /opt/models/model.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mai/medium/es_ES-mai-medium.onnx

COPY package*.json ./
RUN npm install

COPY . ./

CMD ["node", "main.js"]
