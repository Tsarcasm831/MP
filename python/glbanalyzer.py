#!/usr/bin/env python3
"""Simple GLB analyzer for rigging and skeleton information."""

import struct
import json
import sys
from typing import Tuple, Dict, Any


def load_glb(path: str) -> Tuple[Dict[str, Any], bytes]:
    """Return the glTF JSON and binary chunk from a GLB file."""
    with open(path, 'rb') as f:
        header = f.read(12)
        if len(header) != 12:
            raise ValueError('File too short')
        magic, version, length = struct.unpack('<4sII', header)
        if magic != b'glTF':
            raise ValueError('Not a GLB file')
        data = f.read()

    offset = 0
    json_chunk = None
    bin_chunk = b''
    while offset < len(data):
        if offset + 8 > len(data):
            break
        chunk_length, chunk_type = struct.unpack('<II', data[offset:offset+8])
        offset += 8
        chunk_data = data[offset:offset+chunk_length]
        offset += chunk_length
        if chunk_type == 0x4E4F534A:  # JSON
            json_chunk = json.loads(chunk_data.decode('utf-8'))
        elif chunk_type == 0x004E4942:  # BIN
            bin_chunk = chunk_data

    if json_chunk is None:
        raise ValueError('No JSON chunk found in GLB')
    return json_chunk, bin_chunk


def analyze(path: str) -> Dict[str, Any]:
    gltf, _ = load_glb(path)
    details = {
        'num_nodes': len(gltf.get('nodes', [])),
        'num_meshes': len(gltf.get('meshes', [])),
        'num_skins': len(gltf.get('skins', [])),
        'num_animations': len(gltf.get('animations', [])),
        'skins': []
    }
    for skin in gltf.get('skins', []):
        details['skins'].append({
            'joints': len(skin.get('joints', [])),
            'skeleton_root': skin.get('skeleton')
        })
    return details


def main(argv=None):
    argv = argv or sys.argv[1:]
    if not argv:
        print('Usage: glbanalyzer.py model.glb')
        return 1
    details = analyze(argv[0])
    print(json.dumps(details, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
