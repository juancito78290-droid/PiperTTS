FROM apify/actor-node:18

# =========================
# INSTALAR DEPENDENCIAS (ALPINE)
# =========================
RUN apk add --no-cache \
    ffmpeg \
    wget \
    ca-certificates \
    tar

# =========================
# INSTALAR PIPER
# =========================
WORKDIR /opt

RUN wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz \
    && tar -xzf piper_linux_x86_64.tar.gz \
    && cp -r piper/* /opt/piper \
    && chmod +x /opt/piper/piper

# Binario
RUN ln -s /opt/piper/piper /usr/local/bin/piper

ENV LD_LIBRARY_PATH=/opt/piper

# =========================
# MODELO REAL (FUNCIONA)
# =========================
WORKDIR /opt/models

# ESTE SÍ EXISTE (ESPAÑA - MLS 10246 LOW)
RUN wget https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246-low.onnx -O model.onnx \
 && wget https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246-low.onnx.json -O model.onnx.json

# =========================
# APP
# =========================
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "main.js"]
