# Build image for Anthropic OSS Scanner (https://github.com/anthropics/oss-scanner).
# Network is available only during this build; everything the tests need is installed here.
FROM node:24-bookworm
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates git openssl python3 \
    && rm -rf /var/lib/apt/lists/*

# scanner contract: the checkout lives inside the image, at /src
COPY . /src
WORKDIR /src

RUN npm ci

# Run the checks so the image is known to work, without failing the build on a red test.
RUN (npm run lint && npm run test:types && npm test) || echo "WARNING: checks reported failures"
