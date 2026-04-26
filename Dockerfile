# Base real con Debian (glibc)
FROM node:20-bookworm

# Instalar dependencias
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    python3 \
    python3-pip \
    python3-venv \
    unzip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Instalar Piper CLI
RUN wget -q https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_linux_x86_64.tar.gz \
    && tar -xzf piper_linux_x86_64.tar.gz \
    && mv piper /usr/local/bin/piper \
    && chmod +x /usr/local/bin/piper \
    && rm piper_linux_x86_64.tar.gz

# Crear entorno Python
RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"

RUN pip install --upgrade pip

# Dependencias necesarias
RUN pip install --no-cache-dir \
    "numpy<2" \
    onnxruntime \
    piper-phonemize

# Carpeta de trabajo
WORKDIR /usr/src/app

# Copiar código
COPY . ./

# Instalar deps Node
RUN npm install --omit=dev || true

# Ejecutar actor
CMD ["node", "main.js"]
