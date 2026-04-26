FROM node:20-bullseye

# Instalar dependencias
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Instalar Piper
RUN pip3 install --no-cache-dir \
    onnxruntime==1.17.3 \
    piper-tts==1.4.0

# Carpeta de trabajo
WORKDIR /app

# Copiar todo
COPY . .

# Instalar dependencias Node si tienes package.json
RUN npm install

# Ejecutar
CMD ["node", "main.js"]
