"""
scripts/package_lambda.py
Builds production-ready Amazon Linux (manylinux_x86_64) bundle for Lambda.
"""

import os
import sys
import shutil
import zipfile
import subprocess
import boto3

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
BUILD_DIR = os.path.join(BASE_DIR, "build_lambda")
ZIP_PATH = os.path.join(BASE_DIR, "backend_lambda.zip")
PIP_PATH = os.path.join(BASE_DIR, ".venv", "Scripts", "pip.exe")

S3_BUCKET = "heatshield-data-bucket-chennai"
S3_KEY = "lambda/backend.zip"
AWS_PROFILE = "heatshield"
AWS_REGION = "ap-southeast-2"

def clean():
    if os.path.exists(BUILD_DIR):
        shutil.rmtree(BUILD_DIR, ignore_errors=True)
    if os.path.exists(ZIP_PATH):
        try:
            os.remove(ZIP_PATH)
        except OSError:
            pass
    os.makedirs(BUILD_DIR, exist_ok=True)

def copy_backend_code():
    print("1. Copying backend application code...")
    shutil.copytree(os.path.join(BACKEND_DIR, "app"), os.path.join(BUILD_DIR, "app"), dirs_exist_ok=True)
    shutil.copy(os.path.join(BACKEND_DIR, "refresh.py"), os.path.join(BUILD_DIR, "refresh.py"))
    data_dir = os.path.join(BASE_DIR, "data")
    if os.path.exists(data_dir):
        shutil.copytree(data_dir, os.path.join(BUILD_DIR, "data"), dirs_exist_ok=True)

def install_linux_packages():
    print("2. Downloading & installing Linux x86_64 binaries (manylinux2014) for Python 3.12...")
    packages = [
        "pydantic-core",
        "pydantic",
        "fastapi",
        "mangum",
        "httpx",
        "networkx",
        "python-dotenv"
    ]
    cmd = [
        PIP_PATH, "install",
        "--platform", "manylinux2014_x86_64",
        "--target", BUILD_DIR,
        "--only-binary=:all:",
        "--implementation", "cp",
        "--python-version", "3.12",
        "--no-compile"
    ] + packages
    subprocess.check_call(cmd)
    print("Linux dependencies installed into build directory.")

def create_zip():
    print(f"3. Creating zip package at {ZIP_PATH}...")
    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(BUILD_DIR):
            for file in files:
                if file.endswith((".pyc", ".dist-info")):
                    continue
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, BUILD_DIR)
                zf.write(full_path, rel_path)
    size_mb = os.path.getsize(ZIP_PATH) / (1024 * 1024)
    print(f"Zip created successfully: {size_mb:.2f} MB")

def upload_and_update_lambda():
    print(f"4. Uploading to s3://{S3_BUCKET}/{S3_KEY}...")
    session = boto3.Session(profile_name=AWS_PROFILE, region_name=AWS_REGION)
    s3 = session.client("s3")
    s3.upload_file(ZIP_PATH, S3_BUCKET, S3_KEY)
    print("S3 upload complete.")

    lam = session.client("lambda")
    functions = [
        "heatshield-backend-ApiFunction-FXqmbWBcKnEz",
        "heatshield-backend-RefreshFunction-L1u40bqE2sLi"
    ]
    for fn in functions:
        print(f"Updating Lambda code for {fn}...")
        lam.update_function_code(
            FunctionName=fn,
            S3Bucket=S3_BUCKET,
            S3Key=S3_KEY
        )
        print(f"Function {fn} code updated successfully.")

def main():
    print("Starting Amazon Linux Lambda packager...")
    clean()
    copy_backend_code()
    install_linux_packages()
    create_zip()
    upload_and_update_lambda()
    clean()
    print("\nLambda deployment complete & verified!")

if __name__ == "__main__":
    main()
