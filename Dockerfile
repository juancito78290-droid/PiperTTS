FROM apify/actor-node:18-debian

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Instalar Piper + onnxruntime (compatible en Debian)
RUN pip3 install --no-cache-dir \
    onnxruntime==1.17.3 \
    piper-tts==1.4.0

# Crear carpeta de trabajo
WORKDIR /app

# Copiar archivos
COPY . ./

# Comando por defecto
CMD ["node", "main.js"]
