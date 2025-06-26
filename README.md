# MP

This is a minimalist 3D multiplayer prototype. The project includes a
character creator powered by AI.

## Character creator

Characters are generated from text prompts. When a humanoid shape is
described, the AI assembles separate primitives for the head, torso and
limbs to maintain humanoid proportions. All features must fit within a
3×3×3 unit volume and textures or colors should match the prompt for
realism.

## Mobile controls

When a phone or tablet is detected, `PlayerControls` toggles a `mobile-device`
class on the `<body>` element. The responsive stylesheet reveals the on-screen
joystick and jump button whenever this class is present.

## Building CSS

Vendor prefixes are added using PostCSS with Autoprefixer. After installing dependencies with `npm install`, run `npm run build:css` to generate the prefixed files in `styles/`.
