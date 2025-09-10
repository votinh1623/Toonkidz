import sys
import torch
from diffusers import StableDiffusionPipeline
import os
import uuid
import json

# Get parameters from command line
prompt = sys.argv[1]
steps = int(sys.argv[2]) if len(sys.argv) > 2 else 20
num_images = int(sys.argv[3]) if len(sys.argv) > 3 else 4
negative_prompt = sys.argv[4] if len(sys.argv) > 4 else "violence, weapons, blood, gore, scary, horror, frightening, inappropriate, adult content"

print(f"Generating {num_images} images with prompt: {prompt}, steps: {steps}")
print(f"Using negative prompt: {negative_prompt}")

# Load model with GPU optimizations
model_id = "runwayml/stable-diffusion-v1-5"
pipe = StableDiffusionPipeline.from_pretrained(
    model_id, 
    torch_dtype=torch.float16,
    variant="fp16"
)

# GPU optimizations
if torch.cuda.is_available():
    pipe = pipe.to("cuda")
    try:
        pipe.enable_xformers_memory_efficient_attention()
    except ImportError:
        print("xformers not available, using default attention")
    pipe.enable_vae_slicing()
    pipe.enable_vae_tiling()
    pipe.enable_model_cpu_offload()
else:
    pipe = pipe.to("cpu")

# Generate multiple images at once with safety prompts
images = pipe(
    prompt,
    negative_prompt=negative_prompt,  # Add negative prompt here
    num_inference_steps=steps,
    height=512,
    width=512,
    guidance_scale=7.5,
    num_images_per_prompt=num_images,
).images

# Create directory if it doesn't exist
os.makedirs("../../../storage/images/generated", exist_ok=True)

filenames = []
# Save all generated images
for i, image in enumerate(images):
    filename = f"{uuid.uuid4()}.png"
    filepath = os.path.join("../../../storage/images/generated", filename)
    image.save(filepath)
    filenames.append(filename)
    print(f"Saved image {i+1}/{num_images} to {filepath}")

# Output filenames as JSON
print(json.dumps(filenames))
