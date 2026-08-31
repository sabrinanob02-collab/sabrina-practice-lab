from pathlib import Path
from zipfile import ZipFile, BadZipFile

ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "sources"
NEEDLES = {
    b"Anthony Woodside": "student name",
    b"C:\\Users\\": "Windows user path",
    b"\\My Drive\\": "Google Drive path",
    b"github_pat_": "GitHub token prefix",
    b"ghp_": "GitHub token prefix",
}

failures = []
scanned_parts = 0
source_files = sorted(p for p in SOURCE_ROOT.rglob("*") if p.is_file())

for file_path in source_files:
    payloads = [(file_path.name, file_path.read_bytes())]
    if file_path.suffix.lower() in {".docx", ".pptx", ".xlsx"}:
        try:
            with ZipFile(file_path) as archive:
                payloads.extend(
                    (f"{file_path.name}:{name}", archive.read(name))
                    for name in archive.namelist()
                    if name.lower().endswith((".xml", ".rels", ".txt"))
                )
        except BadZipFile:
            failures.append(f"invalid OOXML container: {file_path.name}")
    for label, data in payloads:
        scanned_parts += 1
        for needle, description in NEEDLES.items():
            if needle.lower() in data.lower():
                failures.append(f"{description} found in {label}")

print({"sourceFiles": len(source_files), "scannedParts": scanned_parts, "failures": failures})
raise SystemExit(1 if failures else 0)
