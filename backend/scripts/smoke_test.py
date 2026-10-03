from __future__ import annotations

import argparse
import json
import mimetypes
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from uuid import uuid4


def multipart_body(image_path: Path) -> tuple[bytes, str]:
    boundary = f"ecosort-{uuid4().hex}"
    mime = mimetypes.guess_type(image_path.name)[0] or "application/octet-stream"
    prefix = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{image_path.name}"\r\n'
        f"Content-Type: {mime}\r\n\r\n"
    ).encode("utf-8")
    suffix = f"\r\n--{boundary}--\r\n".encode("utf-8")
    return prefix + image_path.read_bytes() + suffix, boundary


def main() -> int:
    parser = argparse.ArgumentParser(description="Send a real image to an EcoSort API.")
    parser.add_argument("image", type=Path)
    parser.add_argument("--base-url", default="http://localhost:8000")
    args = parser.parse_args()
    if not args.image.is_file():
        parser.error(f"Image not found: {args.image}")

    body, boundary = multipart_body(args.image)
    request = Request(
        f"{args.base_url.rstrip('/')}/predict",
        data=body,
        method="POST",
        headers={
            "Accept": "application/json",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
    )
    try:
        with urlopen(request, timeout=180) as response:
            payload = json.load(response)
    except (HTTPError, URLError) as exc:
        print(f"Smoke test failed: {exc}")
        return 1
    print(json.dumps(payload, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

