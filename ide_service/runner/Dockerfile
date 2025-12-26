FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
  bash coreutils ca-certificates \
  python3 \
  g++ \
  openjdk-17-jdk \
  time \
  && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 10001 runner
WORKDIR /work
COPY run.sh /usr/local/bin/run.sh
RUN chmod +x /usr/local/bin/run.sh
USER runner

ENTRYPOINT ["/usr/local/bin/run.sh"]
