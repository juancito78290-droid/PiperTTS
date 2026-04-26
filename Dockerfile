FROM apify/actor-node:18

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Instalar Piper sin conflictos
RUN pip3 install --no-cache-dir \
    onnxruntime==1.17.3 \
    piper-tts==1.4.0 \
    --break-system-packages

# Crear directorio de trabajo
WORKDIR /usr/src/app

# Copiar archivos
COPY package*.json ./
RUN npm install

COPY . .

# Ejecutar
CMD ["node", "main.js"]
