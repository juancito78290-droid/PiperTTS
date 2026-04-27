FROM apify/actor-node:18

# Instalar dependencias (Alpine correcto)
RUN apk add --no-cache \
    ffmpeg \
    wget \
    tar \
    libstdc++ \
    libgcc \
    espeak-ng

# Descargar Piper
WORKDIR /opt/piper
RUN wget https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_linux_x86_64.tar.gz \
    && tar -xzf piper_linux_x86_64.tar.gz \
    && cp piper/piper /usr/local/bin/piper \
    && chmod +x /usr/local/bin/piper

# Crear carpeta de modelos
RUN mkdir -p /opt/models

# Copiar modelo
COPY model.onnx /opt/models/model.onnx

# App
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "main.js"]
