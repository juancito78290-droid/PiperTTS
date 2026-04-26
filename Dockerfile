FROM apify/actor-node:18

# Instalar dependencias
RUN apk add --no-cache \
    ffmpeg \
    wget \
    python3 \
    py3-pip \
    bash

# Crear carpeta de trabajo
WORKDIR /usr/src/app

# Copiar código
COPY package*.json ./
RUN npm install

COPY . ./

# Instalar Piper (FIX permisos + evitar symlink)
RUN mkdir -p /opt && \
    wget -O /tmp/piper.tar.gz https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz && \
    tar -xzf /tmp/piper.tar.gz -C /opt && \
    mv /opt/piper /opt/piper-bin && \
    chmod -R 755 /opt/piper-bin && \
    cp /opt/piper-bin/piper /usr/bin/piper && \
    chmod 755 /usr/bin/piper && \
    rm /tmp/piper.tar.gz

# Crear carpeta de modelos
RUN mkdir -p /models

# Descargar modelo (Daniela)
RUN wget -O /models/es_AR-daniela-high.onnx \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high/es_AR-daniela-high.onnx && \
    wget -O /models/es_AR-daniela-high.onnx.json \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high/es_AR-daniela-high.onnx.json

# Comando por defecto
CMD ["node", "main.js"]
