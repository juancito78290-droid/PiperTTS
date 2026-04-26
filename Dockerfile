FROM apify/actor-node:18

# Alpine usa apk (NO apt-get)
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

# Crear carpeta de modelos
RUN mkdir -p /models

# Descargar voz Daniela (Argentina)
RUN wget -O /models/es_AR-daniela-low.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/low/es_AR-daniela-low.onnx \
 && wget -O /models/es_AR-daniela-low.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/low/es_AR-daniela-low.onnx.json

# Directorio de trabajo
WORKDIR /usr/src/app

# Instalar dependencias Node
COPY package*.json ./
RUN npm install --omit=dev

# Copiar código
COPY . .

# Ejecutar actor
CMD ["node", "main.js"]
