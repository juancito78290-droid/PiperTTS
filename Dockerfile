FROM node:18-bullseye

# 🔥 Instalar dependencias necesarias
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# =========================
# 🔥 INSTALAR PIPER
# =========================
RUN wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz \
    && tar -xvf piper_linux_x86_64.tar.gz \
    && mv piper /usr/local/bin/piper \
    && chmod +x /usr/local/bin/piper

# =========================
# 🔥 MODELO (MLS 10246)
# =========================
RUN mkdir -p /models

RUN wget -O /models/es_ES-mls_10246-low.onnx \
https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx

RUN wget -O /models/es_ES-mls_10246-low.onnx.json \
https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx.json

# =========================
# 🔥 APP
# =========================
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# =========================
# 🚀 RUN
# =========================
CMD ["node", "main.js"]
