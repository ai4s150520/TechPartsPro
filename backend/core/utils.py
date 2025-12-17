import os
import uuid
from django.utils.text import slugify

def unique_slug_generator(instance, new_slug=None):
    """
    Generates a unique slug for a model instance.
    Recursive function to handle duplicates.
    """
    if new_slug is not None:
        slug = new_slug
    else:
        slug = slugify(instance.name)

    Klass = instance.__class__
    qs_exists = Klass.objects.filter(slug=slug).exists()
    if qs_exists:
        new_slug = "{slug}-{randstr}".format(
            slug=slug,
            randstr=str(uuid.uuid4())[:4]
        )
        return unique_slug_generator(instance, new_slug=new_slug)
    return slug

def upload_to_path(instance, filename):
    """
    Renames uploaded files to a random UUID to prevent 
    filename collisions and guessing.
    path: media/products/uuid.jpg
    """
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join(f"{instance.__class__.__name__.lower()}s", filename)