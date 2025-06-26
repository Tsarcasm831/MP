#!/usr/bin/env python3
"""Command line tool that prints skeleton hierarchy using glbanalyzer."""

import sys
import json
from glbanalyzer import load_glb


def print_skeleton(gltf):
    nodes = gltf.get('nodes', [])
    skins = gltf.get('skins', [])
    for idx, skin in enumerate(skins):
        print(f'Skeleton {idx}:')
        joints = skin.get('joints', [])
        for j in joints:
            node = nodes[j]
            name = node.get('name', f'node{j}')
            print(f'  - {name}')


def main(argv=None):
    argv = argv or sys.argv[1:]
    if not argv:
        print('Usage: skeleton_rigger.py model.glb')
        return 1
    gltf, _ = load_glb(argv[0])
    print_skeleton(gltf)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
