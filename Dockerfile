FROM apify/actor-node:20

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# 🔥 IMPORTANTE: arreglar error de numpy
RUN pip install --no-cache-dir "numpy<2"

# Instalar Piper y dependencias compatibles
RUN pip install --no-cache-dir piper-tts onnxruntime

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos
COPY package*.json ./
RUN npm install

COPY . ./

# Comando de inicio
CMD ["node", "main.js"]
