FROM apify/actor-node:18

# =========================
# DEPENDENCIAS (ALPINE → apk)
# =========================
RUN apk add --no-cache \
    ffmpeg \
    wget \
    ca-certificates \
    bash

# =========================
# INSTALAR PIPER
# =========================
WORKDIR /opt

RUN wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz \
    && tar -xzf piper_linux_x86_64.tar.gz \
    && mv piper /opt/piper

RUN ln -s /opt/piper/piper /usr/local/bin/piper

ENV LD_LIBRARY_PATH=/opt/piper

# =========================
# MODELO MLS 10246 (LOW REAL)
# =========================
WORKDIR /opt/models

RUN wget https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/model.onnx -O model.onnx \
 && wget https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/config.json -O model.onnx.json

# =========================
# APP
# =========================
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "main.js"]
