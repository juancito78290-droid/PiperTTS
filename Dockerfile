FROM apify/actor-node:18

USER root

# Dependencias (Alpine → apk)
RUN apk add --no-cache \
    ffmpeg \
    wget \
    unzip

# Instalar Piper
RUN wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz \
    && tar -xzf piper_linux_x86_64.tar.gz \
    && mv piper /usr/local/bin/piper \
    && chmod +x /usr/local/bin/piper \
    && rm piper_linux_x86_64.tar.gz

# Crear carpeta modelos
RUN mkdir -p /models

# Descargar modelo LOW (el único que existe)
RUN wget -O /models/model.onnx \
https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/es_ES-mls_10246-low.onnx \
&& wget -O /models/model.onnx.json \
https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/es_ES-mls_10246-low.onnx.json

USER node

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

CMD ["node", "main.js"]
