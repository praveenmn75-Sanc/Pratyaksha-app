import os
import glob
import shutil
import random
import logging
import cv2
from ultralytics import YOLO

logging.basicConfig(level=logging.INFO, format="[DATASET-BUILDER] %(asctime)s - %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CAPTURES_DIR = os.path.join(BASE_DIR, "static", "captures")
DATASET_DIR = os.path.join(BASE_DIR, "dataset")

TRAIN_IMG_DIR = os.path.join(DATASET_DIR, "images", "train")
VAL_IMG_DIR = os.path.join(DATASET_DIR, "images", "val")
TRAIN_LBL_DIR = os.path.join(DATASET_DIR, "labels", "train")
VAL_LBL_DIR = os.path.join(DATASET_DIR, "labels", "val")

os.makedirs(TRAIN_IMG_DIR, exist_ok=True)
os.makedirs(VAL_IMG_DIR, exist_ok=True)
os.makedirs(TRAIN_LBL_DIR, exist_ok=True)
os.makedirs(VAL_LBL_DIR, exist_ok=True)

# 1. Gather all captured snapshots
capture_files = [f for f in glob.glob(os.path.join(CAPTURES_DIR, "capture_*.jpg"))]

if len(capture_files) == 0:
    logging.warning("No capture files found in static/captures. Generating synthetic site frame...")
    dummy_path = os.path.join(CAPTURES_DIR, "capture_init.jpg")
    img = 255 * (cv2.imread(os.path.join(CAPTURES_DIR, os.listdir(CAPTURES_DIR)[0])) if len(os.listdir(CAPTURES_DIR)) > 0 else np.zeros((540, 960, 3), dtype="uint8"))
    cv2.imwrite(dummy_path, img)
    capture_files = [dummy_path]

logging.info(f"Found {len(capture_files)} captured frames for dataset construction.")

# Shuffle and split 80% train / 20% val
random.seed(42)
random.shuffle(capture_files)
split_idx = max(1, int(len(capture_files) * 0.8))
train_files = capture_files[:split_idx]
val_files = capture_files[split_idx:]

if len(val_files) == 0:
    val_files = train_files

def copy_and_label(file_list, img_dest_dir, lbl_dest_dir, model):
    for src_path in file_list:
        fname = os.path.basename(src_path)
        dst_img_path = os.path.join(img_dest_dir, fname)
        shutil.copy(src_path, dst_img_path)

        # Run base YOLO prediction to create pseudo YOLO annotations
        res = model.predict(dst_img_path, conf=0.25, verbose=False)[0]
        txt_fname = os.path.splitext(fname)[0] + ".txt"
        dst_lbl_path = os.path.join(lbl_dest_dir, txt_fname)

        with open(dst_lbl_path, "w") as f:
            for box in res.boxes:
                cls_id = int(box.cls[0])
                # Map standard COCO vehicle classes to project index:
                # 0: Car, 1: SUV, 2: Bus, 3: Truck, 4: Auto, 5: Bike, 6: Plate
                coco_map = {2: 0, 3: 1, 5: 2, 7: 3, 1: 5}
                target_cls = coco_map.get(cls_id, 0)

                xywhn = box.xywhn[0].tolist()
                f.write(f"{target_cls} {xywhn[0]:.6f} {xywhn[1]:.6f} {xywhn[2]:.6f} {xywhn[3]:.6f}\n")

logging.info("Auto-annotating dataset splits using base YOLOv8s...")
base_model = YOLO("yolov8s.pt")
copy_and_label(train_files, TRAIN_IMG_DIR, TRAIN_LBL_DIR, base_model)
copy_and_label(val_files, VAL_IMG_DIR, VAL_LBL_DIR, base_model)

# 2. Update data.yaml with absolute local paths
yaml_path = os.path.join(DATASET_DIR, "data.yaml")
with open(yaml_path, "w") as f:
    f.write(f"""path: {os.path.abspath(DATASET_DIR)}
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

logging.info(f"Dataset successfully built & configured at {yaml_path}")
