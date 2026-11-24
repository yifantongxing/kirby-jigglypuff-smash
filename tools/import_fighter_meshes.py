"""Bake the selected c00 SSBH meshes and BC7 color maps into the offline game.

Usage: python tools/import_fighter_meshes.py /path/to/extracted/fighter
Requires ssbh-data-py, numpy and Pillow. Normal gameplay and build.py
only use the generated bundle and don't require the original archives.
"""
import argparse
import base64
import io
import json
import struct
from pathlib import Path

import numpy as np
from PIL import Image
import ssbh_data_py as ssbh


def packed(array, dtype):
    return base64.b64encode(np.asarray(array, dtype=dtype).tobytes()).decode("ascii")


def color_map(source):
    # Read the largest mip in a Switch BC7 surface. Divide the block-linear
    # surface into 64-byte by 8-row GOBs before sending its blocks to Pillow.
    data = source.read_bytes()
    width, height, depth, fmt = struct.unpack_from("<4I", data, len(data) - 44)
    if depth != 1 or fmt not in (0x480, 0x485, 0x4a0, 0x4a5, 0x4e0, 0x4e5):
        raise ValueError(f"Expected a 2D BC1/BC3/BC7 color map in {source}")
    cols, rows = (width + 3) // 4, (height + 3) // 4
    block_height = min(16, max(1, (1 << (rows - 1).bit_length()) // 8))
    y, x = np.mgrid[:rows, :cols]
    codec = {0x480: 1, 0x4a0: 3, 0x4e0: 7}[fmt & ~7]
    block_bytes = 8 if codec == 1 else 16
    x *= block_bytes
    base = (y // (8 * block_height)) * 512 * block_height * ((cols * block_bytes + 63) // 64)
    base += (x // 64) * 512 * block_height + ((y % (block_height * 8)) // 8) * 512
    address = base + (x % 64 // 32) * 256 + (y % 8 // 2) * 64 + (x % 32 // 16) * 32 + (y % 2) * 16
    blocks = np.frombuffer(data, np.uint8)[address[:, :, None] + (x % 16)[:, :, None] + np.arange(block_bytes)]
    image = Image.frombytes("RGBA", (width, height), blocks.tobytes(), "bcn", (codec, f"BC{codec}"))
    image.thumbnail((768, 768), Image.Resampling.LANCZOS)
    stream = io.BytesIO()
    image.save(stream, "WEBP", quality=94, method=5)
    return "data:image/webp;base64," + base64.b64encode(stream.getvalue()).decode("ascii")


def read_rig(directory):
    skel = ssbh.skel_data.read_skel(str(directory / "model.nusktb"))
    mesh = ssbh.mesh_data.read_mesh(str(directory / "model.numshb"))
    model = ssbh.modl_data.read_modl(str(directory / "model.numdlb"))
    matl = ssbh.matl_data.read_matl(str(directory / "model.numatb"))
    labels = {(e.mesh_object_name, e.mesh_object_subindex): e.material_label for e in model.entries}
    ids = {bone.name: i for i, bone in enumerate(skel.bones)}
    bones = [[b.name, b.parent_index, b.transform.ravel().round(6).tolist()] for b in skel.bones]
    faces = []
    for part in mesh.objects:
        pos = part.positions[0].data[:, :3]
        nor = part.normals[0].data[:, :3]
        item = {"name": part.name, "material": labels[part.name, part.subindex],
                "p": packed(pos, "<f4"), "n": packed(np.rint(nor.clip(-1, 1) * 127), "i1"),
                "uv": packed(part.texture_coordinates[0].data, "<f4"),
                "index": packed(part.vertex_indices, "<u2")}
        if len(part.texture_coordinates) > 1:
            item["uv2"] = packed(part.texture_coordinates[1].data, "<f4")
        if part.parent_bone_name:
            item["rigid"] = ids[part.parent_bone_name]
        else:
            weights = np.zeros((len(pos), len(bones)), np.float32)
            for influence in part.bone_influences:
                bone = ids[influence.bone_name]
                for value in influence.vertex_weights:
                    weights[value.vertex_index, bone] = value.vertex_weight
            top = np.argsort(weights, axis=1)[:, -4:][:, ::-1]
            weight = np.take_along_axis(weights, top, axis=1)
            weight /= np.maximum(weight.sum(axis=1, keepdims=True), 1e-8)
            item["bones"] = packed(top, "u1")
            item["weights"] = packed(np.rint(weight * 65535), "<u2")
        faces.append(item)

    textures, materials = {}, {}
    files = {p.stem.lower(): p for p in directory.glob("*.nutexb")}
    for m in matl.entries:
        if m.material_label not in labels.values():
            continue
        maps = {}
        for param in m.textures:
            if param.param_id.name not in ("Texture0", "Texture1"):
                continue
            name = param.data.lower()
            if name not in textures:
                textures[name] = color_map(files[name])
            maps[param.param_id.name] = name
            if param.param_id.name == "Texture1" and "_purin_b" in name:
                gold = name.replace("_purin_b", "_purin_g")
                textures[gold] = color_map(files[gold])
                maps["goldIris"] = gold
        materials[m.material_label] = maps
    return {"bones": bones, "meshes": faces, "materials": materials, "textures": textures}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("fighters", type=Path)
    args = parser.parse_args()
    result = {label: read_rig(args.fighters / who / "model" / part / "c00")
              for label, who, part in [("kirby", "kirby", "body"), ("jigglypuff", "purin", "body"),
                                        ("ultraSword", "kirby", "ultrasword"), ("ultraSwordHat", "kirby", "ultraswordhat"),
                                        ("hammer", "kirby", "hammer"), ("cutter", "kirby", "finalcutter"),
                                        ("stone", "kirby", "stone"), ("copyHat", "kirby", "copy_purin_parts")]}
    # The cutter's Have2 animates the blade length separately from Kirby's grip.
    profiles = {}
    for file in (args.fighters / "kirby/motion/finalcutter/c00").glob("*.nuanmb"):
        animation = ssbh.anim_data.read_anim(str(file))
        node = next(n for g in animation.groups if g.group_type == ssbh.anim_data.GroupType.Transform
                    for n in g.nodes if n.name == "Have2")
        profiles[file.stem] = np.round([v.scale for v in node.tracks[0].values], 5).tolist()
    result["cutter"]["bladeScale"] = profiles
    path = Path(__file__).resolve().parents[1] / "native-fighter-data.js"
    path.write_text("globalThis.SmashRigData=" + json.dumps(result, separators=(",", ":")) + ";\n")
    print(path.name, path.stat().st_size)
