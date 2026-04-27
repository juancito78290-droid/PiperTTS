FROM apify/actor-node:18-bullseye

# Instalar dependencias
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Instalar Piper
RUN wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz \
    && tar -xzf piper_linux_x86_64.tar.gz \
    && cp piper/piper /usr/local/bin/piper \
    && chmod +x /usr/local/bin/piper

# Crear carpeta de modelos
RUN mkdir -p /models

# Descargar modelo CORRECTO (mls_10246)
RUN wget -O /models/model.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/medium/es_ES-mls_10246-medium.onnx \
    && wget -O /models/model.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/medium/es_ES-mls_10246-medium.onnx.json

# Copiar código
COPY package*.json ./
RUN npm install --omit=dev

COPY . ./

CMD ["node", "main.cjs"]
