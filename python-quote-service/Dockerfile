FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
  && pip install --no-cache-dir -r requirements.txt

COPY quote_service.py ./quote_service.py

EXPOSE 8001

CMD ["uvicorn", "quote_service:app", "--host", "0.0.0.0", "--port", "8001"]
