FROM apify/actor-node:18

USER root

# Dependencias (ALPINE)
RUN apk add --no-cache \
    ffmpeg \
    wget \
    tar \
    libstdc++ \
    libgcc \
    espeak-ng

# Descargar Piper
WORKDIR /opt

RUN wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz \
    && tar -xzf piper_linux_x86_64.tar.gz \
    && rm piper_linux_x86_64.tar.gz

# 🔥 MOVER BINARIO Y LIBS CORRECTAMENTE
RUN find . -name "piper" -type f -exec cp {} /usr/local/bin/piper \; \
    && chmod +x /usr/local/bin/piper

# Copiar TODAS las librerías necesarias
RUN find . -name "*.so*" -exec cp {} /usr/local/lib/ \;

# Asegurar libs
ENV LD_LIBRARY_PATH=/usr/local/lib

# Modelos
WORKDIR /opt/models

RUN wget https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/medium/es_ES-medium.onnx -O model.onnx

# App
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

CMD ["node", "main.js"]
