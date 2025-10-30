import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

const SAFETY_PROMPT = "";
const NEGATIVE_PROMPT =
  "violence, weapons, blood, gore, scary, horror, frightening, inappropriate, adult content, sad, depressing, dark, menacing, dangerous, harmful, unsafe, fighting, arguing, crying";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class ImageService {
  static async generateImage(prompt, steps = 20, numImages = 4, keywords = []) {
    const keywordsText =
      Array.isArray(keywords) && keywords.length > 0
        ? ` Keywords: ${keywords.join(", ")}.`
        : "";
    const enhancedPrompt = `${SAFETY_PROMPT}. ${prompt}${keywordsText}`;
    console.log(
      `Generating ${numImages} images for prompt: "${enhancedPrompt}" with ${steps} steps`
    );
    console.log(`Using negative prompt: "${NEGATIVE_PROMPT}"`);

    const scriptPath = path.join(
      path.resolve(),
      "gpu/scripts/generate.py"
    );
    if (!fs.existsSync(scriptPath)) {
      throw new Error("Image generation script not found");
    }

    const generatedDir = path.join(
      path.resolve(),
      "storage/images/generated"
    );
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true });
    }

    const pythonCmd = await this.findPythonExecutable();
    const python = spawn(pythonCmd, [
      scriptPath,
      enhancedPrompt,
      steps.toString(),
      numImages.toString(),
      NEGATIVE_PROMPT,
    ]);

    const output = await this.handlePythonProcess(python);
    const filenames = this.parsePythonOutput(output);

    this.checkCloudinaryConfig();
    return await this.uploadToCloudinary(filenames, generatedDir);
  }

  static async findPythonExecutable() {
    const pythonCommands = ["python", "python3", "py"];
    for (const cmd of pythonCommands) {
      try {
        const testPython = spawn(cmd, ["--version"]);
        await new Promise((resolve, reject) => {
          testPython.on("close", (code) =>
            code === 0 ? resolve() : reject()
          );
          testPython.on("error", reject);
        });
        return cmd;
      } catch {
        console.log(`${cmd} not available, trying next...`);
      }
    }
    throw new Error("Python not found on server");
  }

  static handlePythonProcess(python) {
    return new Promise((resolve, reject) => {
      let output = "";
      let error = "";

      python.stdout.on("data", (data) => {
        output += data.toString();
      });

      python.stderr.on("data", (data) => {
        error += data.toString();
        console.error(`Python stderr: ${data}`);
      });

      python.on("close", (code) => {
        if (code !== 0) {
          reject(
            new Error(`Python process exited with code ${code}. Error: ${error}`)
          );
        } else {
          resolve(output);
        }
      });

      python.on("error", (err) => {
        reject(new Error(`Failed to start Python process: ${err.message}`));
      });
    });
  }

  static parsePythonOutput(output) {
    const lines = output.trim().split("\n");
    const jsonLine = lines[lines.length - 1];
    try {
      const filenames = JSON.parse(jsonLine);
      if (!Array.isArray(filenames))
        throw new Error("Expected an array of filenames");
      return filenames;
    } catch (e) {
      throw new Error(`Failed to parse JSON from Python output: ${jsonLine}`);
    }
  }

  static checkCloudinaryConfig() {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new Error("Cloudinary not configured");
    }
  }

  static async uploadToCloudinary(filenames, generatedDir) {
    const imageUrls = [];
    const uploadErrors = [];

    for (const filename of filenames) {
      const filepath = path.join(generatedDir, filename);
      if (fs.existsSync(filepath)) {
        try {
          const result = await cloudinary.uploader.upload(filepath, {
            folder: "generated-images",
            public_id: `generated_${Date.now()}_${filename}`,
            resource_type: "image",
          });
          imageUrls.push(result.secure_url);
          fs.unlinkSync(filepath);
        } catch (uploadError) {
          uploadErrors.push(filename);
        }
      } else {
        uploadErrors.push(filename);
      }
    }

    if (uploadErrors.length > 0) {
      if (imageUrls.length > 0) {
        return {
          imageUrls,
          warning: `Some images failed to upload: ${uploadErrors.join(", ")}`,
        };
      } else {
        throw new Error(`Failed to upload images: ${uploadErrors.join(", ")}`);
      }
    }

    return { imageUrls };
  }
}

export default ImageService;
