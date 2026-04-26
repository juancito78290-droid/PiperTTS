FROM apify/actor-node:18

RUN apk add --no-cache \
    ffmpeg \
    wget \
    git \
    python3 \
    py3-pip \
    build-base

# Instalar Piper
RUN wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz \
    && tar -xzf piper_linux_x86_64.tar.gz \
    && mv piper /usr/local/bin/piper \
    && chmod +x /usr/local/bin/piper \
    && rm piper_linux_x86_64.tar.gz

# Crear carpeta modelos
RUN mkdir -p /models

# Descargar modelo CORRECTO (daniela HIGH)
RUN wget -O /models/es_AR-daniela-high.onnx \
https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/es_AR-daniela-high.onnx \
&& wget -O /models/es_AR-daniela-high.onnx.json \
https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/es_AR-daniela-high.onnx.json

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

CMD ["node", "main.js"]
