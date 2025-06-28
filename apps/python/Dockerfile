
FROM ghcr.io/astral-sh/uv:python3.13-bookworm


WORKDIR /code

COPY ./pyproject.toml /code/pyproject.toml
COPY ./uv.lock /code/uv.lock

RUN uv sync --locked
COPY ./app /code/app
COPY ./scripts /code/scripts

RUN uv run scripts/check.py





CMD ["fastapi", "run", "app/main.py", "--port", "80", "--workers", "4"]
