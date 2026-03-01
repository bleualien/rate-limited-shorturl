FROM python:3.9-slim
WORKDIR /app


RUN pip install flask gunicorn # Add other packages if needed
# COPY requirements.txt .
# RUN pip install -r requirements.txt
COPY . .
CMD ["python", "app.py"]