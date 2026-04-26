# Usa Debian (glibc) → necesario para onnxruntime
FROM apify/actor-node:20-bookworm

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Crear entorno virtual
RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"

# Actualizar pip
RUN pip install --upgrade pip

# Instalar dependencias Python (compatibles)
RUN pip install --no-cache-dir \
    "numpy<2" \
    onnxruntime \
    piper-phonemize \
    piper-tts

# Copiar proyecto
COPY . ./

# Instalar dependencias Node si tienes package.json
RUN npm install --omit=dev || true

# Comando por defecto (ajústalo si tu archivo principal no es main.js)
CMD ["node", "main.js"]
