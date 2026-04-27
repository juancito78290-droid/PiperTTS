# Base oficial de Apify (Debian, compatible con apt-get)
FROM apify/actor-node:18

# Instalar dependencias
USER root
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Instalar Piper
RUN wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz \
    && tar -xzf piper_linux_x86_64.tar.gz \
    && mv piper /usr/local/bin/piper \
    && chmod +x /usr/local/bin/piper \
    && rm piper_linux_x86_64.tar.gz

# Crear carpeta de modelos
RUN mkdir -p /models

# Descargar modelo LOW correcto
RUN wget -O /models/model.onnx \
https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/es_ES-mls_10246-low.onnx \
&& wget -O /models/model.onnx.json \
https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/es_ES-mls_10246-low.onnx.json

# Volver a usuario seguro
USER node

# Copiar proyecto
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Ejecutar actor
CMD ["node", "main.js"]
