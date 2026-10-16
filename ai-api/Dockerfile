# ISO 20022 Academy · AI API (Google ADK + Gemini)
# Render: New Web Service → this repo → Root Directory "ai-api" → Docker.
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /srv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
COPY schemas ./schemas
RUN useradd --create-home appuser
USER appuser
# Render provides $PORT. No access log: request bodies are never logged anyway,
# but this also keeps visitor IPs out of the logs.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --no-access-log"]
