import re
import sys

def extract_text_from_pdf(file_path):
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
            # Try to find text streams (simple approach)
            # This is very basic and won't work for compressed streams, but worth a shot for simple PDFs
            # Filter for printable ASCII characters
            text = re.sub(b'[^\x20-\x7E\n\r]', b'', content)
            print(f"--- Extracted from {file_path} ---")
            print(text.decode('utf-8', errors='ignore')[:2000]) # Print first 2000 chars
            print("\n-----------------------------------\n")
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_pdf.py <file1> <file2> ...")
        sys.exit(1)
    
    for file_path in sys.argv[1:]:
        extract_text_from_pdf(file_path)
