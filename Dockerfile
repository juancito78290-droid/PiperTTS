FROM node:18-bullseye

# Instalar dependencias
RUN apt-get update && apt-get install -y ffmpeg wget unzip

# Descargar Piper
RUN wget https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_linux_x64.tar.gz \
    && tar -xvf piper_linux_x64.tar.gz \
    && mv piper /usr/local/bin/ \
    && chmod +x /usr/local/bin/piper

# Crear carpeta modelos
RUN mkdir -p /models

# Descargar modelo MLS10246
RUN wget -O /models/es_ES-mls_10246-low.onnx \
https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx

RUN wget -O /models/es_ES-mls_10246-low.onnx.json \
https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx.json

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "main.js"]
