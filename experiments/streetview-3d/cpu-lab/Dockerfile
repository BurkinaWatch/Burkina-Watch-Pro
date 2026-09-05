FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install --no-install-recommends -y \
    ca-certificates \
    colmap \
    ffmpeg \
    imagemagick \
    python3 \
    sqlite3 \
    time \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /lab
COPY verify.sh /lab/verify.sh
RUN chmod 0755 /lab/verify.sh

ENTRYPOINT ["/lab/verify.sh"]