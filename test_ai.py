import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from importer.services import process_all_rows

# ek sample bana rahe hain testing ke liye
sample_rows = [
    {"Full Name": "Amit Kumar", "Email Address": "amit@example.com", "Phone": "9876500000", "City": "Indore"},
    {"Full Name": "No Contact Person", "City": "Bhopal"},
]

result = process_all_rows(sample_rows)
print(result)