from PIL import Image, ImageDraw, ImageFont
import os

# Define operations with desired symbol, background color, and text color.
operations = {
    "and":      {"symbol": "∧",   "bg": "#3498db", "text": "white"},
    "or":       {"symbol": "∨",   "bg": "#2ecc71", "text": "white"},
    "not":      {"symbol": "¬",   "bg": "#e74c3c", "text": "white"},
    "nand":     {"symbol": "¬∧",  "bg": "#9b59b6", "text": "white"},
    "xor":      {"symbol": "⊕",   "bg": "#f1c40f", "text": "black"},
    "nor":      {"symbol": "¬∨",  "bg": "#e67e22", "text": "white"},
    "xnor":     {"symbol": "≡",   "bg": "#1abc9c", "text": "white"},
    "add":      {"symbol": "+",   "bg": "#16a085", "text": "white"},
    "subtract": {"symbol": "−",   "bg": "#c0392b", "text": "white"},
    "multiply": {"symbol": "×",   "bg": "#8e44ad", "text": "white"},
    "divide":   {"symbol": "÷",   "bg": "#2980b9", "text": "white"},
    "average":  {"symbol": "avg", "bg": "#27ae60", "text": "white"},
    "greater":  {"symbol": ">",   "bg": "#d35400", "text": "white"},
    "less":     {"symbol": "<",   "bg": "#f39c12", "text": "white"},
    "equal":    {"symbol": "=",   "bg": "#7f8c8d", "text": "white"},
    "timer":    {"symbol": "⏰",  "bg": "#34495e", "text": "white"},
    "counter":  {"symbol": "#",   "bg": "#2c3e50", "text": "white"}
}

# Create the output directory if it doesn't exist
output_dir = "static/icons"
os.makedirs(output_dir, exist_ok=True)

# Set image dimensions and font size for large, easily recognizable icons.
img_size = (256, 256)
font_size = 150

# Try to load a TrueType font; fallback to default if unavailable.
try:
    font = ImageFont.truetype("arial.ttf", font_size)
except Exception as e:
    print("Could not load arial.ttf, using default font.", e)
    font = ImageFont.load_default()

# Set padding and border width
padding = 16
border_width = 4

for name, props in operations.items():
    symbol = props["symbol"]
    bg_color = props["bg"]
    text_color = props["text"]

    # Create a transparent image
    img = Image.new("RGBA", img_size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw a circle as the background with a black border
    ellipse_box = [padding, padding, img_size[0] - padding, img_size[1] - padding]
    draw.ellipse(ellipse_box, fill=bg_color, outline="black", width=border_width)
    
    # Get the text bounding box using draw.textbbox (Pillow>=8.0)
    bbox = draw.textbbox((0, 0), symbol, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Calculate the position to center the symbol
    position = ((img_size[0] - text_width) / 2, (img_size[1] - text_height) / 2)
    
    # Draw the text onto the image
    draw.text(position, symbol, fill=text_color, font=font)
    
    # Save the image as a PNG file in the output directory
    output_path = os.path.join(output_dir, f"{name}.png")
    img.save(output_path)
    print(f"Saved {output_path}")
