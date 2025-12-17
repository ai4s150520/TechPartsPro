from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import sys

def optimize_image(image_file, max_size=(1200, 1200), quality=85):
    """
    Optimize uploaded image: resize and compress
    """
    img = Image.open(image_file)
    
    # Convert RGBA to RGB if needed
    if img.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
        img = background
    
    # Resize if larger than max_size
    img.thumbnail(max_size, Image.Resampling.LANCZOS)
    
    # Save to BytesIO
    output = BytesIO()
    img.save(output, format='JPEG', quality=quality, optimize=True)
    output.seek(0)
    
    # Create new InMemoryUploadedFile
    return InMemoryUploadedFile(
        output, 'ImageField',
        f"{image_file.name.split('.')[0]}.jpg",
        'image/jpeg',
        sys.getsizeof(output), None
    )

def validate_image(image_file, max_size_mb=2):
    """Validate image file"""
    from django.conf import settings
    
    # Check file size
    if image_file.size > max_size_mb * 1024 * 1024:
        raise ValueError(f'Image size must be less than {max_size_mb}MB')
    
    # Check file type
    if hasattr(settings, 'ALLOWED_IMAGE_TYPES'):
        if image_file.content_type not in settings.ALLOWED_IMAGE_TYPES:
            raise ValueError('Invalid image type. Only JPEG, PNG, and WebP allowed')
    
    return True
