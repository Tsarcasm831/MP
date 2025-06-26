// Preset character collection
export const presetCharacters = [
  {
    id: "jailcell",
    name: "Jail Cell",
    description: "A walking prison cell with bars",
    spec: {
      customMode: true,
      features: [
        {
          type: "box",
          color: "#777777",
          position: { x: 0, y: 0.5, z: 0 },
          scale: { x: 1.2, y: 1, z: 1.2 },
          roughness: 0.8,
          metalness: 0.5,
          name: "base"
        },
        // Vertical bars
        {
          type: "cylinder",
          color: "#333333",
          position: { x: -0.5, y: 0.5, z: -0.5 },
          scale: { x: 0.1, y: 2, z: 0.1 },
          roughness: 0.5,
          metalness: 0.8
        },
        {
          type: "cylinder",
          color: "#333333",
          position: { x: 0.5, y: 0.5, z: -0.5 },
          scale: { x: 0.1, y: 2, z: 0.1 },
          roughness: 0.5,
          metalness: 0.8
        },
        {
          type: "cylinder",
          color: "#333333",
          position: { x: -0.5, y: 0.5, z: 0.5 },
          scale: { x: 0.1, y: 2, z: 0.1 },
          roughness: 0.5,
          metalness: 0.8
        },
        {
          type: "cylinder",
          color: "#333333",
          position: { x: 0.5, y: 0.5, z: 0.5 },
          scale: { x: 0.1, y: 2, z: 0.1 },
          roughness: 0.5,
          metalness: 0.8
        },
        // Horizontal bars
        {
          type: "cylinder",
          color: "#333333",
          position: { x: 0, y: 0, z: -0.5 },
          scale: { x: 0.1, y: 1, z: 0.1 },
          rotation: { x: 0, y: 0, z: Math.PI/2 },
          roughness: 0.5,
          metalness: 0.8
        },
        {
          type: "cylinder",
          color: "#333333",
          position: { x: 0, y: 1, z: -0.5 },
          scale: { x: 0.1, y: 1, z: 0.1 },
          rotation: { x: 0, y: 0, z: Math.PI/2 },
          roughness: 0.5,
          metalness: 0.8
        },
        // Legs that will animate
        {
          type: "cylinder",
          color: "#555555",
          position: { x: -0.3, y: 0, z: 0 },
          scale: { x: 0.1, y: 0.5, z: 0.1 },
          roughness: 0.7,
          metalness: 0.6,
          name: "leftLeg"
        },
        {
          type: "cylinder",
          color: "#555555",
          position: { x: 0.3, y: 0, z: 0 },
          scale: { x: 0.1, y: 0.5, z: 0.1 },
          roughness: 0.7,
          metalness: 0.6,
          name: "rightLeg"
        }
      ],
      description: "A walking prison cell with metal bars"
    }
  },
  {
    id: "seagull",
    name: "Seagull",
    description: "A cartoonish seagull",
    spec: {
      customMode: true,
      features: [
        // Body
        {
          type: "sphere",
          color: "#ffffff",
          position: { x: 0, y: 0.5, z: 0 },
          scale: { x: 0.8, y: 0.6, z: 1 },
          roughness: 0.9,
          metalness: 0
        },
        // Head
        {
          type: "sphere",
          color: "#ffffff",
          position: { x: 0, y: 0.9, z: 0.5 },
          scale: { x: 0.5, y: 0.5, z: 0.5 },
          roughness: 0.9,
          metalness: 0
        },
        // Beak
        {
          type: "cone",
          color: "#ffa500",
          position: { x: 0, y: 0.85, z: 0.9 },
          scale: { x: 0.15, y: 0.4, z: 0.15 },
          rotation: { x: -Math.PI/2, y: 0, z: 0 },
          roughness: 0.7,
          metalness: 0
        },
        // Eyes
        {
          type: "sphere",
          color: "#000000",
          position: { x: -0.15, y: 1, z: 0.7 },
          scale: { x: 0.08, y: 0.08, z: 0.08 },
          roughness: 0.5,
          metalness: 0
        },
        {
          type: "sphere",
          color: "#000000",
          position: { x: 0.15, y: 1, z: 0.7 },
          scale: { x: 0.08, y: 0.08, z: 0.08 },
          roughness: 0.5,
          metalness: 0
        },
        // Wings
        {
          type: "box",
          color: "#eeeeee",
          position: { x: -0.7, y: 0.5, z: 0 },
          scale: { x: 0.8, y: 0.1, z: 0.6 },
          rotation: { x: 0, y: 0, z: -0.3 },
          roughness: 0.9,
          metalness: 0
        },
        {
          type: "box",
          color: "#eeeeee",
          position: { x: 0.7, y: 0.5, z: 0 },
          scale: { x: 0.8, y: 0.1, z: 0.6 },
          rotation: { x: 0, y: 0, z: 0.3 },
          roughness: 0.9,
          metalness: 0
        },
        // Legs
        {
          type: "cylinder",
          color: "#ffa500",
          position: { x: -0.2, y: 0, z: 0 },
          scale: { x: 0.08, y: 0.4, z: 0.08 },
          roughness: 0.7,
          metalness: 0,
          name: "leftLeg"
        },
        {
          type: "cylinder",
          color: "#ffa500",
          position: { x: 0.2, y: 0, z: 0 },
          scale: { x: 0.08, y: 0.4, z: 0.08 },
          roughness: 0.7,
          metalness: 0,
          name: "rightLeg"
        },
        // Tail
        {
          type: "box",
          color: "#eeeeee",
          position: { x: 0, y: 0.5, z: -0.6 },
          scale: { x: 0.4, y: 0.1, z: 0.3 },
          roughness: 0.9,
          metalness: 0
        }
      ],
      description: "A cartoonish seagull with animated legs"
    }
  },
  {
    id: "wireframe",
    name: "Wireframe",
    description: "A walking wireframe character",
    spec: {
      customMode: true,
      features: [
        // Wireframe head
        {
          type: "sphere",
          color: "#00ff00",
          position: { x: 0, y: 1.5, z: 0 },
          scale: { x: 0.5, y: 0.5, z: 0.5 },
          roughness: 0.2,
          metalness: 0.8,
          transparent: true,
          opacity: 0.8
        },
        // Wireframe body
        {
          type: "box",
          color: "#00ff00",
          position: { x: 0, y: 0.9, z: 0 },
          scale: { x: 0.6, y: 0.8, z: 0.3 },
          roughness: 0.2,
          metalness: 0.8,
          transparent: true,
          opacity: 0.8
        },
        // Arms
        {
          type: "cylinder",
          color: "#00ff00",
          position: { x: -0.5, y: 1, z: 0 },
          scale: { x: 0.1, y: 0.6, z: 0.1 },
          rotation: { x: 0, y: 0, z: Math.PI/2 },
          roughness: 0.2,
          metalness: 0.8,
          transparent: true,
          opacity: 0.8
        },
        {
          type: "cylinder",
          color: "#00ff00",
          position: { x: 0.5, y: 1, z: 0 },
          scale: { x: 0.1, y: 0.6, z: 0.1 },
          rotation: { x: 0, y: 0, z: Math.PI/2 },
          roughness: 0.2,
          metalness: 0.8,
          transparent: true,
          opacity: 0.8
        },
        // Legs
        {
          type: "cylinder",
          color: "#00ff00",
          position: { x: -0.2, y: 0.2, z: 0 },
          scale: { x: 0.1, y: 0.8, z: 0.1 },
          roughness: 0.2,
          metalness: 0.8,
          transparent: true,
          opacity: 0.8,
          name: "leftLeg"
        },
        {
          type: "cylinder",
          color: "#00ff00",
          position: { x: 0.2, y: 0.2, z: 0 },
          scale: { x: 0.1, y: 0.8, z: 0.1 },
          roughness: 0.2,
          metalness: 0.8,
          transparent: true,
          opacity: 0.8,
          name: "rightLeg"
        },
        // Base for collision
        {
          type: "box",
          color: "#00ff00",
          position: { x: 0, y: 0, z: 0 },
          scale: { x: 0.5, y: 0.1, z: 0.3 },
          roughness: 0.2,
          metalness: 0.8,
          transparent: true,
          opacity: 0.8
        }
      ],
      description: "A glowing green wireframe character"
    }
  },
  {
    id: "bean",
    name: "Bean",
    description: "A colorful bean-shaped character",
    spec: {
      customMode: true,
      features: [
        // Main bean body
        {
          type: "sphere",
          color: "#FF6B6B",
          position: { x: 0, y: 0.6, z: 0 },
          scale: { x: 0.6, y: 0.9, z: 0.6 },
          roughness: 0.9,
          metalness: 0.1
        },
        // Bottom part (slightly larger)
        {
          type: "sphere",
          color: "#FF6B6B",
          position: { x: 0, y: 0.3, z: 0 },
          scale: { x: 0.7, y: 0.5, z: 0.7 },
          roughness: 0.9,
          metalness: 0.1
        },
        // Eyes (white part)
        {
          type: "sphere",
          color: "#FFFFFF",
          position: { x: -0.2, y: 0.8, z: 0.4 },
          scale: { x: 0.2, y: 0.2, z: 0.1 },
          roughness: 0.5,
          metalness: 0
        },
        {
          type: "sphere",
          color: "#FFFFFF",
          position: { x: 0.2, y: 0.8, z: 0.4 },
          scale: { x: 0.2, y: 0.2, z: 0.1 },
          roughness: 0.5,
          metalness: 0
        },
        // Pupils
        {
          type: "sphere",
          color: "#000000",
          position: { x: -0.2, y: 0.8, z: 0.5 },
          scale: { x: 0.1, y: 0.1, z: 0.05 },
          roughness: 0.5,
          metalness: 0
        },
        {
          type: "sphere",
          color: "#000000",
          position: { x: 0.2, y: 0.8, z: 0.5 },
          scale: { x: 0.1, y: 0.1, z: 0.05 },
          roughness: 0.5,
          metalness: 0
        },
        // Stubby legs
        {
          type: "cylinder",
          color: "#FF6B6B",
          position: { x: -0.3, y: 0, z: 0 },
          scale: { x: 0.15, y: 0.3, z: 0.15 },
          roughness: 0.9,
          metalness: 0.1,
          name: "leftLeg"
        },
        {
          type: "cylinder",
          color: "#FF6B6B",
          position: { x: 0.3, y: 0, z: 0 },
          scale: { x: 0.15, y: 0.3, z: 0.15 },
          roughness: 0.9,
          metalness: 0.1,
          name: "rightLeg"
        }
      ],
      description: "A cute bean-shaped character with stubby legs"
    }
  }
];

// Available texture materials for AI character creator
export const availableTextures = [
  {
    id: "brick",
    name: "Brick Wall",
    textureUrl: "https://threejs.org/examples/textures/brick_diffuse.jpg",
    normalMap: "https://threejs.org/examples/textures/brick_normal.jpg",
    roughness: 0.8,
    metalness: 0.1
  },
  {
    id: "wood",
    name: "Wood",
    textureUrl: "https://threejs.org/examples/textures/hardwood2_diffuse.jpg",
    normalMap: "https://threejs.org/examples/textures/hardwood2_normal.jpg",
    roughness: 0.7,
    metalness: 0.0
  },
  {
    id: "skin",
    name: "Skin",
    color: "#FFD6C4",
    roughness: 0.6,
    metalness: 0.0,
    subsurface: 0.3
  },
  {
    id: "metal",
    name: "Metal",
    color: "#AAAAAA",
    roughness: 0.2,
    metalness: 0.9,
    envMap: true
  },
  {
    id: "water",
    name: "Water",
    color: "#4444FF",
    roughness: 0.1,
    metalness: 0.3,
    transparent: true,
    opacity: 0.7
  },
  {
    id: "glass",
    name: "Glass",
    color: "#FFFFFF",
    roughness: 0.0,
    metalness: 0.1,
    transparent: true,
    opacity: 0.3,
    envMap: true
  }
];

// Available animation properties for AI character creator
export const availableAnimations = [
  {
    id: "jiggly",
    name: "Jiggly",
    description: "Makes the feature jiggle randomly"
  },
  {
    id: "bobUpDown",
    name: "Bob Up & Down",
    description: "Makes the feature move up and down smoothly"
  },
  {
    id: "spinY",
    name: "Spin Y",
    description: "Rotates the feature around the Y axis"
  },
  {
    id: "spinX",
    name: "Spin X",
    description: "Rotates the feature around the X axis"
  },
  {
    id: "spinZ",
    name: "Spin Z",
    description: "Rotates the feature around the Z axis"
  },
  {
    id: "pulse",
    name: "Pulse",
    description: "Makes the feature grow and shrink"
  }
];