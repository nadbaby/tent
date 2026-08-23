import os
from PIL import Image
import pillow_heif

pillow_heif.register_heif_opener()

file = "seallsss_1.png"
if os.path.exists(file):
    try:
        print(f"Processing {file}...")
        img = Image.open(file)
        new_name = file.replace(".heic", ".jpg")
        img.save(new_name, "JPEG")
        print(f"Successfully saved {new_name}")
    except Exception as e:
        print(f"Error processing {file}: {e}")
else:
    print(f"File {file} not found!")
