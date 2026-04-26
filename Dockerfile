FROM apify/actor-node:20

# Instalar dependencias del sistema (Alpine)
RUN apk add --no-cache \
    ffmpeg \
    wget \
    python3 \
    py3-pip \
    py3-virtualenv \
    build-base

# Crear entorno virtual (CLAVE para evitar error PEP 668)
RUN python3 -m venv /venv

# Activar venv e instalar dependencias
RUN . /venv/bin/activate && \
    pip install --no-cache-dir "numpy<2" piper-tts

# Hacer que siempre use ese entorno
ENV PATH="/venv/bin:$PATH"

# Copiar código
WORKDIR /app
COPY . .

CMD ["node", "main.js"]
