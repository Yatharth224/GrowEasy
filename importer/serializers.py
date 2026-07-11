from rest_framework import serializers


class ImportRequestSerializer(serializers.Serializer):
    """
    Frontend se hume ek list milegi CSV rows ki.
    Har row ek dictionary hoga (column name : value).
    Ye serializer sirf check karta hai ki 'rows' naam ka field
    aaya hai aur wo ek list hai.
    """
    rows = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False
    )