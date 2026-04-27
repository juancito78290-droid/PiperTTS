FROM node:18-bullseye

# Dependencias necesarias
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    unzip \
    libstdc++6 \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Instalar Piper COMPLETO
WORKDIR /opt

RUN wget https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_linux_x64.tar.gz \
    && tar -xzf piper_linux_x64.tar.gz \
    && mv piper /opt/piper

# Añadir al PATH
ENV PATH="/opt/piper:${PATH}"

# Modelos
RUN mkdir -p /models

RUN wget -O /models/model.onnx \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx

RUN wget -O /models/model.onnx.json \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx.json

# App
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "main.js"]
