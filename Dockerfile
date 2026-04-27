FROM apify/actor-node:18

USER root

RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    tar \
    libstdc++6 \
    libgcc-s1 \
    libespeak-ng1 \
    espeak-ng \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/piper

# Descargar Piper BINARIO CORRECTO
RUN wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz \
    && tar -xzf piper_linux_x86_64.tar.gz \
    && cp piper/piper /usr/local/bin/piper \
    && chmod +x /usr/local/bin/piper

# Verificar instalación
RUN which piper && piper --help

# Modelo (puedes cambiarlo luego)
RUN mkdir -p /opt/models \
    && wget -O /opt/models/model.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mai/medium/es_ES-mai-medium.onnx

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . ./

CMD ["node", "main.js"]
