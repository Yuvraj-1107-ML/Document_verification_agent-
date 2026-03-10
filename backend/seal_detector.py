import cv2
import numpy as np
import base64
import os

class SealDetector:
    def __init__(self):
        pass

    def detect_and_crop_seals(self, image_bytes):
        """
        Detects circular seals in an image and returns cropped base64 versions.
        """
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return []

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Blur to reduce noise
        gray = cv2.medianBlur(gray, 5)

        # Detect circles
        circles = cv2.HoughCircles(
            gray, 
            cv2.HOUGH_GRADIENT, 
            dp=1.2, 
            minDist=100,
            param1=50, 
            param2=30, 
            minRadius=50, 
            maxRadius=300
        )

        seals = []
        if circles is not None:
            circles = np.uint16(np.around(circles))
            for i in circles[0, :]:
                x, y, r = i[0], i[1], i[2]
                
                # Crop with some padding
                h, w = img.shape[:2]
                y1 = max(0, y - r - 10)
                y2 = min(h, y + r + 10)
                x1 = max(0, x - r - 10)
                x2 = min(w, x + r + 10)
                
                crop = img[y1:y2, x1:x2]
                
                if crop is None or crop.size == 0:
                    continue

                # Encode to base64
                _, buffer = cv2.imencode('.jpg', crop)
                base64_image = base64.b64encode(buffer).decode('utf-8')
                
                seals.append({
                    "image": f"data:image/jpeg;base64,{base64_image}",
                    "center": (int(x), int(y)),
                    "radius": int(r)
                })
        
        return seals

if __name__ == "__main__":
    print("SealDetector loaded.")
