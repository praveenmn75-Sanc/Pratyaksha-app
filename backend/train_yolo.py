import os
import sys
import logging
from ultralytics import YOLO

logging.basicConfig(level=logging.INFO, format="[YOLO-TRAINER] %(asctime)s - %(message)s")

# 1. Ensure Ultralytics and PyTorch CUDA are active
try:
    import torch
    if not torch.cuda.is_available():
        logging.warning("CUDA unavailable! Training will proceed on CPU (slower).")
    else:
        logging.info(f"CUDA GPU Active for Training: {torch.cuda.get_device_name(0)}")
except ImportError:
    logging.error("PyTorch / Ultralytics missing. Run: pip install ultralytics torch torchvision")
    sys.exit(1)

# 2. Path to dataset yaml configuration
DATASET_YAML = os.path.join(os.path.dirname(__file__), "dataset", "data.yaml")

if not os.path.exists(DATASET_YAML):
    logging.info(f"Creating sample dataset configuration at {DATASET_YAML}...")
    os.makedirs(os.path.dirname(DATASET_YAML), exist_ok=True)
    with open(DATASET_YAML, "w") as f:
        f.write(f"""path: {os.path.abspath(os.path.dirname(DATASET_YAML))}
train: images/train
val: images/val

names:
  0: Car
  1: SUV
  2: Bus
  3: Truck
  4: Auto
  5: Bike
  6: Plate
""")

def run_yolo_training():
    logging.info("Loading pre-trained YOLOv8s base weights...")
    model = YOLO("yolov8s.pt")

    logging.info("Starting fine-tuning on site dataset...")
    model.train(
        data=DATASET_YAML,
        epochs=100,
        imgsz=640,
        batch=16,
        device=0 if torch.cuda.is_available() else "cpu",
        project=os.path.join(os.path.dirname(__file__), "runs"),
        name="pratyaksha_anpr_yolo",
        exist_ok=True
    )

    best_weights = os.path.join(os.path.dirname(__file__), "runs", "pratyaksha_anpr_yolo", "weights", "best.pt")
    logging.info(f"Training Complete! Fine-tuned weights stored at: {best_weights}")

if __name__ == "__main__":
    run_yolo_training()
