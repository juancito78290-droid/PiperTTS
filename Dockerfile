FROM node:18-bullseye

# Instalar dependencias
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar dependencias Node
COPY package*.json ./
RUN npm install

# Copiar código
COPY . .

# =========================
# 🔥 INSTALAR PIPER
# =========================
RUN wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz \
    && tar -xzf piper_linux_x86_64.tar.gz \
    && mv piper /usr/local/bin/ \
    && chmod +x /usr/local/bin/piper

# =========================
# 🔥 DESCARGAR MODELO MLS10246
# =========================
RUN mkdir -p /models

RUN wget -O /models/es_ES-mls_10246-low.onnx \
https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx

RUN wget -O /models/es_ES-mls_10246-low.onnx.json \
https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx.json

# =========================
# 🚀 RUN
# =========================
CMD ["node", "main.js"]
