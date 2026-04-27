FROM apify/actor-node:18

USER root

# Dependencias sistema (Alpine)
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

# Instalar dependencias Python
RUN /venv/bin/pip install --upgrade pip setuptools wheel
RUN /venv/bin/pip install -r requirements.txt

# Activar venv global
ENV PATH="/venv/bin:$PATH"

# Volver al actor
WORKDIR /usr/src/app

COPY . ./

RUN npm install --omit=dev

CMD ["node", "main.js"]
