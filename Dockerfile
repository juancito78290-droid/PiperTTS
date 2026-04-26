FROM apify/actor-node:20

# Instalar dependencias (ALPINE -> apk, no apt-get)
RUN apk add --no-cache \
    ffmpeg \
    wget \
    python3 \
    py3-pip \
    build-base

# 🔥 IMPORTANTE: arreglar error de numpy
RUN pip3 install --no-cache-dir "numpy<2"

# Instalar piper TTS
RUN pip3 install --no-cache-dir piper-tts

# Copiar archivos del actor
COPY . ./

# Comando de inicio
CMD ["node", "main.js"]
