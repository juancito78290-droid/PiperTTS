FROM node:18-bullseye

# Instalar dependencias
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Instalar Piper
RUN wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz && \
    tar -xzf piper_linux_x86_64.tar.gz && \
    mv piper /usr/local/bin/

# Descargar modelo hls10246 (España)
RUN mkdir -p /models && \
    wget -O /models/model.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/hls10246/es_ES-hls10246.onnx && \
    wget -O /models/model.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/hls10246/es_ES-hls10246.onnx.json

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "main.js"]
