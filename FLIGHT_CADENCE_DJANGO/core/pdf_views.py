"""PDF -> Word conversion view for FLIGHT CADENCE.

Mirrors legacy FastAPI /api/pdf-to-word endpoint using pdf2docx.
CSRF-exempt, accepts multipart/form-data file upload, returns the converted
.docx as a downloadable FileResponse.
"""
import os
import tempfile

from django.http import JsonResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from pdf2docx import Converter


@csrf_exempt
@require_http_methods(["POST"])
def pdf_to_word(request):
    """Convert an uploaded PDF to a DOCX file and return it for download."""
    if "file" not in request.FILES:
        return JsonResponse({"error": "No file provided."}, status=400)

    uploaded = request.FILES["file"]
    if not uploaded.name.lower().endswith(".pdf"):
        return JsonResponse({"error": "Must be a PDF file."}, status=400)

    pdf_fd, pdf_path = tempfile.mkstemp(suffix=".pdf")
    docx_fd, docx_path = tempfile.mkstemp(suffix=".docx")

    try:
        with os.fdopen(pdf_fd, "wb") as f:
            for chunk in uploaded.chunks():
                f.write(chunk)

        cv = Converter(pdf_path)
        cv.convert(docx_path)
        cv.close()

        out_name = uploaded.name.rsplit(".", 1)[0] + "_converted.docx"
        response = FileResponse(
            open(docx_path, "rb"),
            as_attachment=True,
            filename=out_name,
            content_type=(
                "application/vnd.openxmlformats-officedocument."
                "wordprocessingml.document"
            ),
        )
        # Schedule cleanup after the response is sent.
        response["X-Cleanup-Paths"] = f"{pdf_path}|{docx_path}"
        return response
    except Exception as exc:  # noqa: BLE001
        try:
            os.remove(pdf_path)
        except OSError:
            pass
        try:
            os.remove(docx_path)
        except OSError:
            pass
        return JsonResponse({"error": f"PDF conversion failed: {exc}"}, status=500)
