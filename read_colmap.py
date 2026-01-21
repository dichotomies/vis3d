#!/usr/bin/env python3
"""
Read COLMAP binary files and export to JSON for web visualization.
Pure Python implementation without numpy.
"""

import struct
import json
import math
from pathlib import Path


def read_next_bytes(fid, num_bytes, format_char_sequence, endian_character="<"):
    """Read and unpack bytes from a binary file."""
    data = fid.read(num_bytes)
    return struct.unpack(endian_character + format_char_sequence, data)


def read_cameras_binary(path):
    """Read cameras.bin file."""
    cameras = {}
    with open(path, "rb") as fid:
        num_cameras = read_next_bytes(fid, 8, "Q")[0]
        for _ in range(num_cameras):
            camera_properties = read_next_bytes(fid, 24, "iiQQ")
            camera_id = camera_properties[0]
            model_id = camera_properties[1]
            width = camera_properties[2]
            height = camera_properties[3]
            
            # Number of parameters depends on camera model
            num_params_dict = {0: 3, 1: 4, 2: 4, 3: 5, 4: 8, 5: 12, 6: 4, 7: 5, 8: 8, 9: 12, 10: 5}
            num_params = num_params_dict.get(model_id, 4)
            params = read_next_bytes(fid, 8 * num_params, "d" * num_params)
            
            cameras[camera_id] = {
                "id": camera_id,
                "model_id": model_id,
                "width": width,
                "height": height,
                "params": list(params)
            }
    return cameras


def read_images_binary(path):
    """Read images.bin file."""
    images = {}
    with open(path, "rb") as fid:
        num_reg_images = read_next_bytes(fid, 8, "Q")[0]
        for _ in range(num_reg_images):
            binary_image_properties = read_next_bytes(fid, 64, "idddddddi")
            image_id = binary_image_properties[0]
            qw, qx, qy, qz = binary_image_properties[1:5]
            tx, ty, tz = binary_image_properties[5:8]
            camera_id = binary_image_properties[8]
            
            # Read image name (null-terminated string)
            image_name = b""
            current_char = fid.read(1)
            while current_char != b"\x00":
                image_name += current_char
                current_char = fid.read(1)
            image_name = image_name.decode("utf-8")
            
            # Read 2D points
            num_points2D = read_next_bytes(fid, 8, "Q")[0]
            for _ in range(num_points2D):
                read_next_bytes(fid, 24, "ddq")  # Skip point2D data
            
            images[image_id] = {
                "id": image_id,
                "qvec": [qw, qx, qy, qz],
                "tvec": [tx, ty, tz],
                "camera_id": camera_id,
                "name": image_name,
                "num_points2D": num_points2D
            }
    return images


def read_points3D_binary(path):
    """Read points3D.bin file."""
    points3D = {}
    with open(path, "rb") as fid:
        num_points = read_next_bytes(fid, 8, "Q")[0]
        for _ in range(num_points):
            binary_point_line_properties = read_next_bytes(fid, 43, "QdddBBBd")
            point3D_id = binary_point_line_properties[0]
            xyz = list(binary_point_line_properties[1:4])
            rgb = list(binary_point_line_properties[4:7])
            error = binary_point_line_properties[7]
            
            # Read track length and skip track data
            track_length = read_next_bytes(fid, 8, "Q")[0]
            fid.read(8 * track_length)  # Skip track entries (2 ints each)
            
            points3D[point3D_id] = {
                "id": point3D_id,
                "xyz": xyz,
                "rgb": rgb,
                "error": error,
                "track_length": track_length
            }
    return points3D


def qvec_to_rotmat(qvec):
    """Convert quaternion to rotation matrix (3x3 list of lists)."""
    qw, qx, qy, qz = qvec
    return [
        [1 - 2*qy**2 - 2*qz**2,     2*qx*qy - 2*qz*qw,     2*qx*qz + 2*qy*qw],
        [    2*qx*qy + 2*qz*qw, 1 - 2*qx**2 - 2*qz**2,     2*qy*qz - 2*qx*qw],
        [    2*qx*qz - 2*qy*qw,     2*qy*qz + 2*qx*qw, 1 - 2*qx**2 - 2*qy**2]
    ]


def transpose(m):
    """Transpose a 3x3 matrix."""
    return [[m[j][i] for j in range(3)] for i in range(3)]


def mat_vec_mult(m, v):
    """Multiply 3x3 matrix by 3-vector."""
    return [sum(m[i][j] * v[j] for j in range(3)) for i in range(3)]


def get_camera_center(qvec, tvec):
    """Get camera center in world coordinates: C = -R^T * t"""
    R = qvec_to_rotmat(qvec)
    Rt = transpose(R)
    neg_tvec = [-tvec[0], -tvec[1], -tvec[2]]
    return mat_vec_mult(Rt, neg_tvec)


if __name__ == "__main__":
    sparse_path = Path("data/fern/sparse/0")
    
    print("Reading COLMAP binary files...")
    cameras = read_cameras_binary(sparse_path / "cameras.bin")
    images = read_images_binary(sparse_path / "images.bin")
    points3D = read_points3D_binary(sparse_path / "points3D.bin")
    
    print(f"Loaded {len(cameras)} cameras, {len(images)} images, {len(points3D)} 3D points")
    
    # Prepare data for web visualization
    # Point cloud data
    points_data = []
    for pid, point in points3D.items():
        points_data.append({
            "x": point["xyz"][0],
            "y": point["xyz"][1],
            "z": point["xyz"][2],
            "r": point["rgb"][0],
            "g": point["rgb"][1],
            "b": point["rgb"][2]
        })
    
    # Camera positions
    cameras_data = []
    for img_id, img in images.items():
        center = get_camera_center(img["qvec"], img["tvec"])
        R = qvec_to_rotmat(img["qvec"])
        Rt = transpose(R)
        # Camera viewing direction is -Z axis in camera space, transformed to world space
        view_dir = mat_vec_mult(Rt, [0, 0, -1])
        
        cameras_data.append({
            "id": img_id,
            "name": img["name"],
            "position": center,
            "view_direction": view_dir,
            "qvec": img["qvec"],
            "camera_id": img["camera_id"]
        })
    
    # Save to JSON
    output = {
        "points": points_data,
        "cameras": cameras_data,
        "camera_intrinsics": cameras
    }
    
    with open("data/fern/reconstruction.json", "w") as f:
        json.dump(output, f)
    
    print(f"Saved reconstruction.json with {len(points_data)} points and {len(cameras_data)} cameras")
