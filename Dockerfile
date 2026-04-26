FROM apify/actor-node:18

# Instalar dependencias
RUN apk add --no-cache \
    ffmpeg \
    wget \
    git \
    python3 \
    py3-pip \
    bash

# Crear carpeta
RUN mkdir -p /opt/piper

# Descargar Piper (SIEMPRE latest para evitar 404)
RUN wget -O /tmp/piper.tar.gz \
    https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz && \
    tar -xzf /tmp/piper.tar.gz -C /opt/piper && \
    chmod +x /opt/piper/piper && \
    ln -s /opt/piper/piper /usr/local/bin/piper && \
    rm /tmp/piper.tar.gz

# Crear carpeta de modelos
RUN mkdir -p /models

# Descargar modelo Daniela (ESTO TE FALTABA 🔥)
RUN wget -O /models/es_AR-daniela-high.onnx \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high/es_AR-daniela-high.onnx && \
    wget -O /models/es_AR-daniela-high.onnx.json \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high/es_AR-daniela-high.onnx.json

# Copiar código
COPY package*.json ./
RUN npm install --omit=dev

COPY . ./

CMD ["node", "main.js"]
