
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim
RUN curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh

WORKDIR /code

COPY ./pyproject.toml /code/pyproject.toml
COPY ./uv.lock /code/uv.lock

RUN uv sync --locked
COPY ./app /code/app
COPY ./scripts /code/scripts

# RUN uv run scripts/check.py





CMD ["uvicorn", "app/main:app", "--port", "80", "--workers", "4"]
