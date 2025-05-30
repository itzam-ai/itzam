import sys
import json
import requests
from chonkie import TokenChunker
import tiktoken

def get_text_from_tika(url, tika_url="http://localhost:9998/tika"):
    # Download the file from the URL
    file_response = requests.get(url)
    file_response.raise_for_status()
    file_content = file_response.content

    # Send the file to Tika for text extraction
    tika_response = requests.put(
        tika_url,
        headers={"Accept": "text/plain"},
        data=file_content,
    )
    tika_response.raise_for_status()
    return tika_response.text

def main():
    url = sys.argv[1]
    mimeType = sys.argv[2] if len(sys.argv) > 2 else None
    tika_url = sys.argv[3] if len(sys.argv) > 3 else "http://localhost:9998/tika"

    # Get text content from Tika
    content = get_text_from_tika(url, tika_url)

    tokenizer = tiktoken.get_encoding("cl100k_base")

    # Initialize the chunker
    chunker = TokenChunker(tokenizer)

    # Chunk the text
    chunks = chunker(content)
    chunks = [chunk.text for chunk in chunks]

    print(json.dumps({"chunks": chunks, "count": len(chunks)}))

if __name__ == "__main__":
    main()