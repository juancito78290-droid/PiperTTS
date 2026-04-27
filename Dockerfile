FROM node:18-bullseye

# Instalar dependencias
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Instalar PIPER correctamente
WORKDIR /tmp

RUN wget https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_linux_x64.tar.gz \
    && tar -xzf piper_linux_x64.tar.gz \
    && mv piper /usr/local/bin/piper \
    && chmod +x /usr/local/bin/piper

# Crear carpeta de modelos
RUN mkdir -p /models

# Descargar modelo MLS 10246
RUN wget -O /models/model.onnx \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx

RUN wget -O /models/model.onnx.json \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx.json

# App
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "main.js"]
