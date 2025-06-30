import subprocess
import sys
from pathlib import Path


def run_command(command: str, cwd: Path | None = None) -> tuple[int, str, str]:
    """Run a command and return exit code, stdout, and stderr."""
    try:
        result = subprocess.run(
            command, shell=True, cwd=cwd, capture_output=True, text=True, check=False
        )
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return 1, "", str(e)


def check_typing_and_linting() -> bool:
    """Run typecheck and lint commands from package.json."""
    project_root = Path(__file__).parent.parent

    print("🔍 Running typecheck...")
    exit_code, stdout, stderr = run_command("mypy .", cwd=project_root)

    if exit_code != 0:
        print("❌ Typecheck failed:")
        print(stdout)
        print(stderr)
        return False

    print("✅ Typecheck passed")

    print("\n🔍 Running linting...")
    exit_code, stdout, stderr = run_command("ruff check .", cwd=project_root)

    if exit_code != 0:
        print("❌ Linting failed:")
        print(stdout)
        print(stderr)
        return False

    print("✅ Linting passed")

    return True


if __name__ == "__main__":
    success = check_typing_and_linting()
    sys.exit(0 if success else 1)
