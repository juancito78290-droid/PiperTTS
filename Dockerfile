FROM node:18-slim

# 🔥 Instalar dependencias
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 🔥 Instalar Piper
RUN curl -L https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz \
    | tar -xz -C /usr/local/bin --strip-components=1

# 🔥 Crear carpeta modelos
WORKDIR /models

# 🔥 Descargar modelo MLS 10246 LOW
RUN curl -L -o es_ES-mls_10246-low.onnx \
https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx

RUN curl -L -o es_ES-mls_10246-low.onnx.json \
https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx.json

# 🔥 App
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

CMD ["node", "main.js"]
