# --------
# Builder
# --------
FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

# Copy the entire source code
COPY cmd/ ./cmd/
COPY internal/ ./internal/

# Build the Go app
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o main ./cmd/...

# --------
# Runtime
# --------
FROM alpine:3

WORKDIR /service

# Copy binary and config
COPY --from=builder /app/main ./main

# Use non-root user (UID 1001)
USER 1001

ENTRYPOINT ["/service/main"]
