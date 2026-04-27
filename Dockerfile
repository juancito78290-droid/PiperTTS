FROM node:18-bullseye

ENV DEBIAN_FRONTEND=noninteractive

# Dependencias completas (FIX real)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    unzip \
    ca-certificates \
    libstdc++6 \
    libgomp1 \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Descargar Piper
RUN wget https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_linux_x86_64.tar.gz \
    && tar -xzf piper_linux_x86_64.tar.gz \
    && mv piper/piper /usr/local/bin/piper \
    && chmod +x /usr/local/bin/piper \
    && rm -rf piper piper_linux_x86_64.tar.gz

# Crear carpeta de modelos
RUN mkdir -p /models

# 🔥 TUS LINKS (NO TOCADOS)
RUN wget -O /models/model.onnx \
https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx?download=true \
&& wget -O /models/model.onnx.json \
https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx.json?download=true

# Validación opcional (evita errores silenciosos)
RUN test -f /models/model.onnx && test -f /models/model.onnx.json

# App
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "main.js"]
