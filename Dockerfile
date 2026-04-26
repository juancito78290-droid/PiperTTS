# IMPORTANTE: usar Debian (glibc), no Alpine
FROM apify/actor-node:20-bookworm

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    python3 \
    python3-pip \
    python3-venv \
    unzip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Instalar Piper CLI (binario real)
RUN wget -q https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_linux_x86_64.tar.gz \
    && tar -xzf piper_linux_x86_64.tar.gz \
    && mv piper /usr/local/bin/piper \
    && chmod +x /usr/local/bin/piper \
    && rm piper_linux_x86_64.tar.gz

# Crear entorno virtual Python
RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"

# Actualizar pip
RUN pip install --upgrade pip

# Instalar dependencias Python necesarias para Piper
RUN pip install --no-cache-dir \
    "numpy<2" \
    onnxruntime \
    piper-phonemize

# Copiar proyecto
COPY . ./

# Instalar Node dependencies si existen
RUN npm install --omit=dev || true

# Ejecutar tu main.js
CMD ["node", "main.js"]
