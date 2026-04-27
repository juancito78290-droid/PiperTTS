FROM apify/actor-node:18

USER root

# Instalar dependencias
RUN apk update && apk add --no-cache \
    ffmpeg \
    python3 \
    py3-pip \
    git \
    wget \
    bash

# Clonar Piper
RUN git clone https://github.com/rhasspy/piper /piper

WORKDIR /piper

# Crear entorno virtual (evita error PEP 668)
RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"

# Instalar dependencias básicas necesarias
RUN pip install --upgrade pip setuptools wheel numpy

# Volver al actor
WORKDIR /usr/src/app

# Copiar archivos
COPY . ./

RUN npm install

CMD ["node", "main.js"]
