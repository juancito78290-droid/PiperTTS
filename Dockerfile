FROM apify/actor-node:18

USER root

RUN apk update && apk add --no-cache \
    ffmpeg \
    python3 \
    py3-pip \
    git \
    wget \
    bash

# Piper
RUN git clone https://github.com/rhasspy/piper /piper

WORKDIR /piper

# Entorno virtual (evita error PEP 668)
RUN python3 -m venv /venv
RUN /venv/bin/pip install --upgrade pip setuptools wheel
RUN /venv/bin/pip install -r requirements.txt

ENV PATH="/venv/bin:$PATH"

# Actor
WORKDIR /usr/src/app
COPY . ./

RUN npm install --omit=dev

CMD ["node", "main.js"]
