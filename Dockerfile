FROM apify/actor-node:18

# =========================
# DEPENDENCIAS (ALPINE)
# =========================
RUN apk add --no-cache \
    ffmpeg \
    wget \
    ca-certificates \
    tar

# =========================
# INSTALAR PIPER (SIN ERRORES)
# =========================
WORKDIR /opt

RUN wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz \
    && tar -xzf piper_linux_x86_64.tar.gz \
    && chmod +x piper/piper

# BINARIO
RUN ln -s /opt/piper/piper /usr/local/bin/piper

# LIBS
ENV LD_LIBRARY_PATH=/opt/piper

# =========================
# MODELO REAL (MLS 10246 LOW)
# =========================
WORKDIR /opt/models

RUN wget https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/model.onnx -O model.onnx \
 && wget https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/config.json -O model.onnx.json

# =========================
# APP
# =========================
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "main.js"]
