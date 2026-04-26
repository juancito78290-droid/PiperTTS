FROM apify/actor-node:20

# Instalar dependencias del sistema (Alpine usa apk, no apt)
RUN apk add --no-cache \
    ffmpeg \
    wget \
    python3 \
    py3-pip \
    py3-virtualenv \
    build-base \
    libstdc++ \
    libgcc

# Crear entorno virtual
RUN python3 -m venv /venv

# Activar venv en todo el contenedor
ENV PATH="/venv/bin:$PATH"

# Actualizar pip dentro del venv
RUN pip install --upgrade pip

# Instalar dependencias en orden correcto (CLAVE)
RUN pip install --no-cache-dir \
    "numpy<2" \
    onnxruntime==1.17.3 \
    piper-phonemize==1.1.0 \
    piper-tts==1.4.2

# Directorio de trabajo
WORKDIR /usr/src/app

# Copiar archivos
COPY . ./

# Instalar dependencias Node
RUN npm install --omit=dev

# Comando de inicio
CMD ["npm", "start"]
