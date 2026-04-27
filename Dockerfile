FROM apify/actor-node:18

USER root

# Instalar dependencias (ALPINE → usar apk, NO apt-get)
RUN apk add --no-cache \
    ffmpeg \
    wget \
    tar \
    libstdc++ \
    libgcc \
    espeak-ng

# Instalar Piper correctamente (con librerías)
WORKDIR /opt/piper

RUN wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz \
    && tar -xzf piper_linux_x86_64.tar.gz \
    && cp -r piper/* /usr/local/ \
    && chmod +x /usr/local/bin/piper

# Asegurar que las librerías sean encontradas
ENV LD_LIBRARY_PATH=/usr/local/lib

# Crear carpeta de modelos
WORKDIR /opt/models

# ⚠️ IMPORTANTE:
# Debes subir tu modelo .onnx a tu repo o descargarlo aquí
# Ejemplo (puedes cambiarlo por tu modelo real):
RUN wget https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/medium/es_ES-medium.onnx -O model.onnx

# Volver al app
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

CMD ["node", "main.js"]
