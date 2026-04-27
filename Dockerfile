FROM node:18-slim

# Instalar dependencias necesarias
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Instalar Piper
WORKDIR /opt
RUN wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz \
    && tar -xzf piper_linux_x86_64.tar.gz \
    && mv piper /opt/piper \
    && chmod +x /opt/piper/piper

# Agregar al PATH
ENV PATH="/opt/piper:${PATH}"
ENV LD_LIBRARY_PATH="/opt/piper"

# Descargar modelo válido (ESPAÑOL)
WORKDIR /opt/models
RUN wget https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/amy/low/model.onnx -O model.onnx \
    && wget https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/amy/low/config.json -O model.onnx.json

# App
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "main.js"]
