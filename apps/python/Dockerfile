FROM python:3.12

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt
COPY ./app /code/app
COPY ./scripts /code/scripts

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# RUN python scripts/check.py

CMD ["fastapi", "run", "app/main.py", "--port", "80", "--workers", "4"]